import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma';

// 이메일 발송 설정
const createTransporter = () => {
  // 환경 변수에서 이메일 설정 가져오기
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailSecure = process.env.EMAIL_SECURE === 'true';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('이메일 설정이 없습니다. EMAIL_USER와 EMAIL_PASSWORD 환경 변수를 설정하세요.');
    return null;
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

export class EmailService {
  /**
   * 이메일 인증 코드 생성 및 저장 (PostgreSQL 함수 사용, 폴백 포함)
   */
  static async createVerificationCode(userId: string): Promise<string> {
    try {
      // PostgreSQL 함수를 사용하여 코드 생성 및 저장
      // 재전송 제한도 함수 내부에서 처리됨
      const result = await prisma.$queryRaw<Array<{ create_verification_code: string }>>`
        SELECT create_verification_code(${userId}::TEXT) as create_verification_code
      `;
      
      if (result && result.length > 0 && result[0].create_verification_code) {
        return result[0].create_verification_code;
      }
    } catch (error: any) {
      console.warn('PostgreSQL function not available, using fallback:', error.message);
      
      // PostgreSQL 함수가 없을 경우 폴백: 기존 방식 사용
      // 재전송 제한 확인
      const canResend = await this.checkResendLimitFallback(userId);
      if (!canResend) {
        throw new Error('재전송 제한에 도달했습니다. 5분 후에 다시 시도해주세요.');
      }
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await prisma.emailVerification.create({
        data: {
          userId,
          code,
          expiresAt,
          attempts: 0,
        },
      });

      return code;
    }
    
    throw new Error('인증 코드 생성에 실패했습니다.');
  }

  /**
   * 재전송 제한 확인 (폴백용)
   */
  private static async checkResendLimitFallback(userId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ check_resend_limit: boolean }>>`
        SELECT check_resend_limit(${userId}::TEXT) as check_resend_limit
      `;
      
      if (result && result.length > 0) {
        return result[0].check_resend_limit;
      }
    } catch (error) {
      // 함수가 없으면 직접 계산
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentResends = await prisma.emailVerification.count({
        where: {
          userId,
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
      });

      return recentResends < 3;
    }
    
    return false;
  }

  /**
   * 재전송 제한 확인 (PostgreSQL 함수 사용, 폴백 포함)
   */
  static async checkResendLimit(userId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ check_resend_limit: boolean }>>`
        SELECT check_resend_limit(${userId}::TEXT) as check_resend_limit
      `;
      
      if (result && result.length > 0) {
        return result[0].check_resend_limit;
      }
    } catch (error) {
      // 함수가 없으면 폴백 사용
      return await this.checkResendLimitFallback(userId);
    }
    
    return false;
  }

  /**
   * 인증 이메일 발송
   */
  static async sendVerificationEmail(email: string, name: string, code: string): Promise<void> {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('이메일 서비스가 설정되지 않았습니다.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email`;
    const appName = process.env.APP_NAME || 'Problems Community';

    const mailOptions = {
      from: `"${appName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[${appName}] 이메일 인증 코드`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">이메일 인증</h2>
          <p>안녕하세요, ${name}님!</p>
          <p>${appName}에 가입해주셔서 감사합니다.</p>
          <p>아래 인증 코드를 입력하여 이메일 인증을 완료해주세요:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f5f5f5; border: 2px dashed #667eea; border-radius: 10px; 
                        padding: 20px; display: inline-block;">
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                ${code}
              </div>
            </div>
          </div>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #667eea; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              인증 페이지로 이동
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            이 코드는 10분 후에 만료됩니다.<br>
            만약 이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.
          </p>
        </div>
      `,
      text: `
이메일 인증

안녕하세요, ${name}님!

${appName}에 가입해주셔서 감사합니다.

아래 인증 코드를 입력하여 이메일 인증을 완료해주세요:

인증 코드: ${code}

인증 페이지: ${verificationUrl}

이 코드는 10분 후에 만료됩니다.
만약 이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  /**
   * 이메일 인증 코드 검증 및 사용자 인증 완료 처리 (PostgreSQL 함수 사용, 폴백 포함)
   */
  static async verifyCode(code: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      // PostgreSQL 함수를 사용하여 코드 검증 및 인증 처리
      const result = await prisma.$queryRaw<Array<{ verify_email_code: any }>>`
        SELECT verify_email_code(${code.trim()}::TEXT, ${email.trim()}::TEXT) as verify_email_code
      `;
      
      if (result && result.length > 0 && result[0].verify_email_code) {
        const verificationResult = result[0].verify_email_code as { success: boolean; message: string };
        return {
          success: verificationResult.success,
          message: verificationResult.message,
        };
      }
    } catch (error: any) {
      console.warn('PostgreSQL function not available, using fallback:', error.message);
      // 폴백: 기존 방식 사용
      return await this.verifyCodeFallback(code, email);
    }
    
    return { success: false, message: '인증 처리 중 오류가 발생했습니다.' };
  }

  /**
   * 코드 검증 폴백 (기존 방식)
   */
  private static async verifyCodeFallback(code: string, email: string): Promise<{ success: boolean; message: string }> {
    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // 가장 최근의 미인증 코드 찾기
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
        verifiedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      // 시도 횟수 증가 (가장 최근 미인증 코드가 있다면)
      const latestVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          verifiedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (latestVerification) {
        await prisma.emailVerification.update({
          where: { id: latestVerification.id },
          data: {
            attempts: {
              increment: 1,
            },
          },
        });

        // 5회 실패 시 잠금
        if (latestVerification.attempts + 1 >= 5) {
          return { success: false, message: '인증 코드 입력 시도 횟수를 초과했습니다. 새 코드를 요청해주세요.' };
        }
      }

      return { success: false, message: '유효하지 않은 인증 코드입니다.' };
    }

    if (verification.verifiedAt) {
      return { success: false, message: '이미 인증된 코드입니다.' };
    }

    if (new Date() > verification.expiresAt) {
      return { success: false, message: '인증 코드가 만료되었습니다. 새 코드를 요청해주세요.' };
    }

    // 시도 횟수 확인
    if (verification.attempts >= 5) {
      return { success: false, message: '인증 코드 입력 시도 횟수를 초과했습니다. 새 코드를 요청해주세요.' };
    }

    // 사용자 이메일 인증 완료 처리
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // 인증 코드 사용 처리
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    return { success: true, message: '이메일 인증이 완료되었습니다.' };
  }

  /**
   * 인증 이메일 재발송 (사용자 ID로)
   */
  static async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (user.emailVerified) {
      throw new Error('이미 인증된 이메일입니다.');
    }

    try {
      // PostgreSQL 함수를 사용하여 코드 생성 (재전송 제한도 함수 내부에서 처리)
      const code = await this.createVerificationCode(userId);
      
      // 이메일 발송
      await this.sendVerificationEmail(user.email, user.name, code);
    } catch (error: any) {
      // PostgreSQL 함수에서 발생한 에러 처리
      if (error.message?.includes('재전송 제한')) {
        throw new Error('재전송 제한에 도달했습니다. 5분 후에 다시 시도해주세요.');
      }
      throw error;
    }
  }

  /**
   * 인증 이메일 재발송 (이메일로)
   */
  static async resendVerificationEmailByEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (user.emailVerified) {
      throw new Error('이미 인증된 이메일입니다.');
    }

    try {
      // PostgreSQL 함수를 사용하여 코드 생성 (재전송 제한도 함수 내부에서 처리)
      const code = await this.createVerificationCode(user.id);
      
      // 이메일 발송
      await this.sendVerificationEmail(user.email, user.name, code);
    } catch (error: any) {
      // PostgreSQL 함수에서 발생한 에러 처리
      if (error.message?.includes('재전송 제한')) {
        throw new Error('재전송 제한에 도달했습니다. 5분 후에 다시 시도해주세요.');
      }
      throw error;
    }
  }

  /**
   * 만료된 코드 정리 (수동 실행용)
   */
  static async cleanupExpiredCodes(): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ cleanup_expired_verification_codes: number }>>`
      SELECT cleanup_expired_verification_codes() as cleanup_expired_verification_codes
    `;
    
    if (!result || result.length === 0) {
      return 0;
    }
    
    return result[0].cleanup_expired_verification_codes;
  }
}

