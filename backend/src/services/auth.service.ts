import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { User } from '@prisma/client';

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
        // 데이터베이스 제약 조건 에러 처리 (P2002 = unique constraint violation)
        if (error.code === 'P2002') {
          // email 필드에 unique constraint가 있으므로 중복 이메일
          throw new Error('이미 존재하는 이메일입니다.');
        }
        throw new Error(`사용자 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }

      // 이메일 인증 코드 생성 및 이메일 발송
      try {
        const { EmailService } = await import('./email.service');
        const verificationCode = await EmailService.createVerificationCode(user.id);
        await EmailService.sendVerificationEmail(email, name, verificationCode);
      } catch (error: any) {
        console.error('이메일 발송 실패:', error);
        // 이메일 발송 실패해도 사용자는 생성됨 (나중에 재발송 가능)
        // 하지만 에러 메시지는 기록
        if (error.message?.includes('재전송 제한')) {
          console.warn('재전송 제한으로 인해 이메일을 발송할 수 없습니다.');
        }
      }

      // 자동 인증 시도 (신원 인증)
      try {
        const { VerificationService } = await import('./verification.service');
        await VerificationService.autoVerifyUser(user.id, email);
      } catch (error: any) {
        console.error('자동 인증 실패:', error);
        // 자동 인증 실패해도 사용자는 생성됨
      }

      // Generate JWT token
      let token;
      try {
        token = this.generateToken(user.id);
      } catch (error: any) {
        console.error('JWT 토큰 생성 실패:', error);
        throw new Error(`토큰 생성 실패: ${error.message || 'JWT_SECRET이 설정되지 않았습니다.'}`);
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
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
      throw new Error('JWT_SECRET is not properly configured');
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

