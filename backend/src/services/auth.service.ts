import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  static async register(email: string, password: string, name: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false, // 이메일 인증 전까지 false
      },
    });

    // 이메일 인증 코드 생성 및 이메일 발송
    try {
      const { EmailService } = await import('./email.service');
      const verificationCode = await EmailService.createVerificationCode(user.id);
      await EmailService.sendVerificationEmail(email, name, verificationCode);
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      // 이메일 발송 실패해도 사용자는 생성됨 (나중에 재발송 가능)
    }

    // 자동 인증 시도 (신원 인증)
    const { VerificationService } = await import('./verification.service');
    await VerificationService.autoVerifyUser(user.id, email);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
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
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  }
}

