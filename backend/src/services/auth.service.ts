import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export class AuthService {
  static async register(
    name: string,
    email: string,
    username: string,
    password: string
  ): Promise<AuthResult> {
    try {
      // JWT_SECRET 검증
      if (!JWT_SECRET || JWT_SECRET === 'default-secret') {
        throw new Error('JWT_SECRET이 설정되지 않았습니다.');
      }
      const byteLength = Buffer.byteLength(JWT_SECRET, 'utf8');
      if (byteLength < 32) {
        throw new Error(`JWT_SECRET이 너무 짧습니다 (${byteLength}바이트). 최소 32바이트가 필요합니다.`);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      let user;
      try {
        user = await prisma.user.create({
          data: {
            name,
            email,
            username,
            passwordHash,
          },
        });
      } catch (error: any) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          // Unique constraint violation
          const meta = error.meta as { target?: string[] };
          if (meta?.target?.includes('username')) {
            throw new Error('이미 사용 중인 아이디입니다');
          }
          if (meta?.target?.includes('email')) {
            throw new Error('이미 사용 중인 이메일입니다');
          }
        }
        throw new Error(`사용자 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Remove passwordHash from user object
      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error: any) {
      // 이미 처리된 에러는 그대로 throw
      if (error.message?.includes('이미 사용 중인') || 
          error.message?.includes('JWT_SECRET') ||
          error.message?.includes('토큰 생성 실패')) {
        throw error;
      }
      console.error('회원가입 중 예상치 못한 오류:', error);
      throw new Error(`회원가입 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  }

  static async login(username: string, password: string): Promise<AuthResult> {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove passwordHash from user object
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }


  static generateToken(userId: string): string {
    if (!JWT_SECRET || JWT_SECRET === 'default-secret') {
      throw new Error('JWT_SECRET is not properly configured. Please set JWT_SECRET environment variable in Render dashboard.');
    }
    
    // JWT_SECRET 길이 검증 (바이트 기준, 최소 32바이트)
    const byteLength = Buffer.byteLength(JWT_SECRET, 'utf8');
    if (byteLength < 32) {
      throw new Error(`JWT_SECRET is too short (${byteLength} bytes). Minimum 32 bytes (256bit) required for security.`);
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

