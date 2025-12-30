import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validationResult } from 'express-validator';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      const result = await AuthService.register(email, password, name);

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error); // 에러 로깅 추가
      
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: error.message });
      }
      
      // PostgreSQL 함수 에러 메시지 전달
      const errorMessage = error.message || error.meta?.message || 'Registration failed';
      res.status(500).json({ error: errorMessage });
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

