import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validationResult } from 'express-validator';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: '입력값 검증 실패',
          details: errors.array() 
        });
      }

      const { email, password, name } = req.body;

      // 필수 필드 확인
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: '이메일, 비밀번호, 이름은 필수입니다.' 
        });
      }

      const result = await AuthService.register(email, password, name);

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error stack:', error.stack);
      
      // Prisma 에러 타입으로 분기 (문자열 매칭보다 안전)
      if (error instanceof PrismaClientKnownRequestError) {
        // P2002 = Unique constraint violation (중복 이메일)
        if (error.code === 'P2002') {
          return res.status(409).json({ error: '이미 등록된 이메일입니다.' });
        }
        // 기타 Prisma 에러
        console.error('Prisma error code:', error.code);
      }
      
      // Connection pool timeout 에러 처리 (Prisma 에러 타입 + 문자열 매칭 fallback)
      if (error.message?.includes('Timed out fetching a new connection') ||
          error.message?.includes('connection pool') ||
          error.code === 'P1008' || // Prisma connection pool timeout 에러 코드
          error.code === 'P1017') {  // Prisma server closed connection 에러 코드
        console.error('⚠️  Connection pool timeout - 요청이 너무 많거나 연결이 해제되지 않았습니다.');
        return res.status(503).json({ 
          error: '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' 
        });
      }
      
      // 이미 존재하는 사용자 (문자열 매칭 fallback)
      if (error.message === 'User already exists' || error.message.includes('이미 존재하는')) {
        return res.status(409).json({ error: '이미 등록된 이메일입니다.' });
      }
      
      // 입력값 검증 에러
      if (error.message?.includes('입력값 검증')) {
        return res.status(400).json({ error: error.message });
      }
      
      // 토큰 생성 실패
      if (error.message?.includes('토큰 생성 실패')) {
        return res.status(500).json({ 
          error: '서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.' 
        });
      }
      
      // 기타 에러 - 상세 메시지 전달
      const errorMessage = error.message || error.meta?.message || '회원가입에 실패했습니다.';
      res.status(500).json({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.stack 
        })
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.json(result);
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Please use OAuth to login') {
        return res.status(401).json({ error: error.message });
      }
      if (error.message.includes('이메일 인증')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      const user = (req as any).user;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { code, email } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: '인증 코드가 필요합니다.' });
      }

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: '이메일이 필요합니다.' });
      }

      const { EmailService } = await import('../services/email.service');
      const result = await EmailService.verifyCode(code.trim(), email.trim());

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || '이메일 인증에 실패했습니다.' });
    }
  }

  static async resendVerificationEmail(req: any, res: Response) {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { EmailService } = await import('../services/email.service');
      await EmailService.resendVerificationEmail(((req as any).user as { id: string; email: string; role: string }).id);

      res.json({ message: '인증 이메일이 재발송되었습니다.' });
    } catch (error: any) {
      if (error.message === '이미 인증된 이메일입니다.' || error.message.includes('재전송 제한')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || '이메일 재발송에 실패했습니다.' });
    }
  }

  static async resendVerificationEmailByEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: '이메일이 필요합니다.' });
      }

      const { EmailService } = await import('../services/email.service');
      await EmailService.resendVerificationEmailByEmail(email.trim());

      res.json({ message: '인증 이메일이 재발송되었습니다.' });
    } catch (error: any) {
      if (error.message === '이미 인증된 이메일입니다.' || error.message.includes('재전송 제한')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || '이메일 재발송에 실패했습니다.' });
    }
  }
}

