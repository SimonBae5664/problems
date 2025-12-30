import { Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { AuthRequest } from '../middleware/auth';
import { VerificationType } from '@prisma/client';

export class VerificationController {
  /**
   * 사용자 인증 요청
   */
  static async requestVerification(req: Request, res: Response) {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { type, documentUrl } = req.body;
      const emailDomain = (req as any).user.email ? VerificationService.extractDomain((req as any).user.email) : undefined;

      const verification = await VerificationService.createVerification(
        ((req as any).user as { id: string; email: string; role: string }).id,
        type as VerificationType,
        emailDomain,
        documentUrl
      );

      res.status(201).json({ verification });
    } catch (error: any) {
      if (error.message === 'Verification already exists') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to request verification' });
    }
  }

  /**
   * 사용자의 인증 상태 조회
   */
  static async getMyVerifications(req: Request, res: Response) {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const verifications = await VerificationService.getUserVerifications(((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ verifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get verifications' });
    }
  }

  /**
   * 운영진: 대기 중인 인증 목록 조회
   */
  static async getPendingVerifications(req: Request, res: Response) {
    try {
      const verifications = await VerificationService.getPendingVerifications();
      res.json({ verifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pending verifications' });
    }
  }

  /**
   * 운영진: 인증 승인
   */
  static async approveVerification(req: Request, res: Response) {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const verification = await VerificationService.approveVerification(id, ((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ verification });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve verification' });
    }
  }

  /**
   * 운영진: 인증 거부
   */
  static async rejectVerification(req: Request, res: Response) {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const verification = await VerificationService.rejectVerification(
        id,
        ((req as any).user as { id: string; email: string; role: string }).id,
        reason
      );
      res.json({ verification });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject verification' });
    }
  }
}

