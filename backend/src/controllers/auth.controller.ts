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
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Registration failed' });
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
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      const user = req.user;
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}

