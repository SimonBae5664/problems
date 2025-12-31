import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  static async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user directly - DB unique constraint will handle duplicates
      // 이렇게 하면 DB 왕복이 1번으로 줄어서 connection pool 압박이 크게 감소합니다
      // findUnique + create (2번) → create만 (1번)
      let user;
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            emailVerified: false, // 이메일 인증 전까지 false
          },
        });
      } catch (error: any) {
        console.error('사용자 생성 실패:', error);
        // Prisma 에러 타입으로 분기 (문자열 매칭보다 안전)
        if (error instanceof PrismaClientKnownRequestError) {
          // P2002 = Unique constraint violation (중복 이메일)
          if (error.code === 'P2002') {
            // email 필드에 unique constraint가 있으므로 중복 이메일
            throw new Error('이미 존재하는 이메일입니다.');
          }
          // 기타 Prisma 에러 코드
          console.error('Prisma error code:', error.code);
        }
        throw new Error(`사용자 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }

      // Generate JWT token (사용자 생성 후 즉시 토큰 생성)
      // 토큰 생성 실패 시 회원가입 전체가 실패하므로 먼저 처리
      let token;
      try {
        token = this.generateToken(user.id);
      } catch (error: any) {
        console.error('JWT 토큰 생성 실패:', error);
        // JWT_SECRET이 설정되지 않은 경우 명확한 에러 메시지
        if (error.message?.includes('JWT_SECRET') || !process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret') {
          throw new Error('JWT_SECRET이 설정되지 않았습니다. Render 대시보드에서 JWT_SECRET 환경 변수를 설정해주세요.');
        }
        throw new Error(`토큰 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      // 회원가입 성공 응답을 먼저 반환하기 위해 결과 준비
      const result = {
        user: userWithoutPassword,
        token,
      };

      // 이메일 인증 코드 생성 및 이메일 발송 (비동기, 실패해도 회원가입은 성공)
      // 이메일 발송은 응답 후에 처리하여 사용자 대기 시간을 줄임
      setImmediate(async () => {
        try {
          const { EmailService } = await import('./email.service');
          const verificationCode = await EmailService.createVerificationCode(user.id);
          await EmailService.sendVerificationEmail(email, name, verificationCode);
        } catch (error: any) {
          console.error('이메일 발송 실패 (회원가입은 성공):', error);
          // 이메일 발송 실패해도 사용자는 생성됨 (나중에 재발송 가능)
          if (error.message?.includes('재전송 제한')) {
            console.warn('재전송 제한으로 인해 이메일을 발송할 수 없습니다.');
          }
          if (error.code === 'ETIMEDOUT') {
            console.warn('이메일 서버 연결 타임아웃 - SMTP 설정을 확인하세요.');
          }
        }
      });

      // 자동 인증 시도 (신원 인증) - 비동기 처리
      setImmediate(async () => {
        try {
          const { VerificationService } = await import('./verification.service');
          await VerificationService.autoVerifyUser(user.id, email);
        } catch (error: any) {
          console.error('자동 인증 실패 (회원가입은 성공):', error);
          // 자동 인증 실패해도 사용자는 생성됨
        }
      });

      // 회원가입 성공 응답 반환 (이메일 발송과 독립적으로)
      return result;
    } catch (error: any) {
      // 이미 처리된 에러는 그대로 throw
      if (error.message === 'User already exists' || 
          error.message.includes('이미 존재하는') ||
          error.message.includes('토큰 생성 실패')) {
        throw error;
      }
      // 기타 예상치 못한 에러
      console.error('회원가입 중 예상치 못한 오류:', error);
      throw new Error(`회원가입 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  }

  static async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 이메일 인증 여부 확인
    if (!user.emailVerified) {
      throw new Error('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }


  static generateToken(userId: string): string {
    if (!JWT_SECRET || JWT_SECRET === 'default-secret') {
      throw new Error('JWT_SECRET is not properly configured. Please set JWT_SECRET environment variable in Render dashboard.');
    }
    
    // JWT_SECRET 길이 검증 (바이트 기준)
    const byteLength = Buffer.byteLength(JWT_SECRET, 'utf8');
    if (byteLength < 16) {
      throw new Error(`JWT_SECRET is too short (${byteLength} bytes). Minimum 16 bytes (recommended: 32 bytes) required.`);
    }
    
    return jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );
  }

  static verifyToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  }
}

