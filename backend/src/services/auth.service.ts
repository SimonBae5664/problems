import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
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
      },
    });

    // 자동 인증 시도
    const { VerificationService } = await import('./verification.service');
    await VerificationService.autoVerifyUser(user.id, email);

    // Generate token
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

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has password (OAuth users might not have password)
    if (!user.password) {
      throw new Error('Please use OAuth to login');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
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

  static async findOrCreateOAuthUser(
    provider: 'google' | 'kakao',
    providerId: string,
    email: string,
    name: string
  ): Promise<AuthResult> {
    const field = provider === 'google' ? 'googleId' : 'kakaoId';

    // Try to find existing user by provider ID
    let user = await prisma.user.findUnique({
      where: { [field]: providerId },
    });

    if (!user) {
      // Try to find by email
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Update existing user with provider ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [field]: providerId },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name,
            [field]: providerId,
          },
        });
      }
    }

    // 자동 인증 시도
    const { VerificationService } = await import('./verification.service');
    await VerificationService.autoVerifyUser(user.id, email);

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
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  }
}

