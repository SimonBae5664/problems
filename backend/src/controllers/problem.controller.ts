import { Request, Response, RequestHandler } from 'express';
import { ExpressRequest } from '../middleware/auth';
import { ProblemService } from '../services/problem.service';
import { Subject, Difficulty } from '@prisma/client';

export class ProblemController {
  /**
   * 문제 제출
   */
  static createProblem: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, description, subject, difficulty, pdfUrl } = req.body;

      if (!title || !subject || !pdfUrl) {
        return res.status(400).json({ error: 'Title, subject, and pdfUrl are required' });
      }

      const problem = await ProblemService.createProblem({
        title,
        description,
        subject: subject as Subject,
        difficulty: difficulty as Difficulty | undefined,
        pdfUrl,
        submittedById: ((req as any).user as { id: string; email: string; role: string }).id,
      });

      res.status(201).json({ problem });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create problem' });
    }
  };

  /**
   * 공개된 문제 목록 조회
   */
  static getPublishedProblems: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const subject = req.query.subject as Subject | undefined;
      const difficulty = req.query.difficulty as Difficulty | undefined;

      const result = await ProblemService.getPublishedProblems(page, limit, subject, difficulty);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get problems' });
    }
  };

  /**
   * 문제 상세 조회
   */
  static getProblemById: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      const { id } = req.params;
      const includeUnpublished = (req as any).user?.role === 'ADMIN' || 
        ((req as any).user && await ProblemService.getProblemById(id, true).then(p => p.submittedById === (req as any).user?.id).catch(() => false));

      const problem = await ProblemService.getProblemById(id, includeUnpublished || false);
      res.json({ problem });
    } catch (error: any) {
      if (error.message === 'Problem not found' || error.message === 'Problem not found or not published') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get problem' });
    }
  };

  /**
   * 내가 제출한 문제 목록
   */
  static getMyProblems: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ProblemService.getMyProblems(((req as any).user as { id: string; email: string; role: string }).id, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get my problems' });
    }
  };

  /**
   * 운영진: 대기 중인 문제 목록
   */
  static getPendingProblems: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ProblemService.getPendingProblems(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pending problems' });
    }
  };

  /**
   * 운영진: 문제 승인
   */
  static approveProblem: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const problem = await ProblemService.approveProblem(id, ((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ problem });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to approve problem' });
    }
  };

  /**
   * 운영진: 문제 거부
   */
  static rejectProblem: RequestHandler = async (req: Request, res: Response) => {
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

      const problem = await ProblemService.rejectProblem(id, ((req as any).user as { id: string; email: string; role: string }).id, reason);
      res.json({ problem });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to reject problem' });
    }
  };

  /**
   * 운영진: 검수 시작
   */
  static startReview: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const problem = await ProblemService.startReview(id, ((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ problem });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to start review' });
    }
  };
}
