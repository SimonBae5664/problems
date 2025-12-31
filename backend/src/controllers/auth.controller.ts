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

      const { name, email, username, password } = req.body;

      // 필수 필드 확인
      if (!name || !email || !username || !password) {
        return res.status(400).json({ 
          error: '이름, 이메일, 아이디, 비밀번호는 필수입니다.' 
        });
      }

      const result = await AuthService.register(name, email, username, password);

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // 중복 처리 - username/email 구분
      if (error.message === '이미 사용 중인 아이디입니다') {
        return res.status(409).json({ error: '이미 사용 중인 아이디입니다' });
      }
      if (error.message === '이미 사용 중인 이메일입니다') {
        return res.status(409).json({ error: '이미 사용 중인 이메일입니다' });
      }
      
      // Connection pool timeout 에러 처리
      if (error.message?.includes('Timed out fetching a new connection') ||
          error.message?.includes('connection pool') ||
          error.code === 'P1008' ||
          error.code === 'P1017') {
        console.error('⚠️  Connection pool timeout');
        return res.status(503).json({ 
          error: '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' 
        });
      }
      
      // 입력값 검증 에러
      if (error.message?.includes('입력값 검증') || error.message?.includes('JWT_SECRET')) {
        return res.status(400).json({ error: error.message });
      }
      
      // 기타 에러
      const errorMessage = error.message || '회원가입에 실패했습니다.';
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

      const { username, password } = req.body;

      const result = await AuthService.login(username, password);

      res.json(result);
    } catch (error: any) {
      // 로그인 실패는 통일된 메시지로 반환 (보안)
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid credentials' });
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
}

