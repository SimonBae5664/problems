import { Request, Response, RequestHandler } from 'express';
import { ExpressRequest } from '../middleware/auth';
import { VerificationService } from '../services/verification.service';
import { VerificationType } from '@prisma/client';

export class VerificationController {
  /**
   * 사용자 인증 요청
   */
  static requestVerification: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
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
  };

  /**
   * 사용자의 인증 상태 조회
   */
  static getMyVerifications: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const verifications = await VerificationService.getUserVerifications(((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ verifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get verifications' });
    }
  };

  /**
   * 운영진: 대기 중인 인증 목록 조회
   */
  static getPendingVerifications: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      const verifications = await VerificationService.getPendingVerifications();
      res.json({ verifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pending verifications' });
    }
  };

  /**
   * 운영진: 인증 승인
   */
  static approveVerification: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
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
  };

  /**
   * 운영진: 인증 거부
   */
  static rejectVerification: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
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
  };
}
