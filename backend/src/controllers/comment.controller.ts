import { Request, Response, RequestHandler } from 'express';
import { ExpressRequest } from '../middleware/auth';
import { CommentService } from '../services/comment.service';

type CommentSortOrder = 'NEWEST' | 'OLDEST' | 'MOST_LIKED';

export class CommentController {
  /**
   * 댓글 작성
   */
  static createComment: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content, problemId, parentId } = req.body;

      if (!content || !problemId) {
        return res.status(400).json({ error: 'Content and problemId are required' });
      }

      const comment = await CommentService.createComment({
        content,
        problemId,
        authorId: ((req as any).user as { id: string; email: string; role: string }).id,
        parentId,
      });

      res.status(201).json({ comment });
    } catch (error: any) {
      if (error.message === 'Problem not found' || error.message === 'Cannot comment on unpublished problem') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to create comment' });
    }
  };

  /**
   * 댓글 수정
   */
  static updateComment: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const comment = await CommentService.updateComment(id, ((req as any).user as { id: string; email: string; role: string }).id, content);
      res.json({ comment });
    } catch (error: any) {
      if (error.message === 'Comment not found' || error.message === 'Not authorized to edit this comment') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to update comment' });
    }
  };

  /**
   * 댓글 삭제
   */
  static deleteComment: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      await CommentService.deleteComment(id, ((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Comment not found' || error.message === 'Not authorized to delete this comment') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to delete comment' });
    }
  };

  /**
   * 댓글 목록 조회
   */
  static getComments: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      const { problemId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const sortOrder = (req.query.sortOrder as CommentSortOrder) || 'NEWEST';
      const includeReplies = req.query.includeReplies !== 'false';

      const result = await CommentService.getComments(
        problemId,
        page,
        limit,
        sortOrder,
        includeReplies
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get comments' });
    }
  };

  /**
   * 댓글 좋아요/싫어요
   */
  static toggleLike: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { isLike } = req.body;

      if (typeof isLike !== 'boolean') {
        return res.status(400).json({ error: 'isLike must be a boolean' });
      }

      const comment = await CommentService.toggleLike(id, ((req as any).user as { id: string; email: string; role: string }).id, isLike);
      res.json({ comment });
    } catch (error: any) {
      if (error.message === 'Comment not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to toggle like' });
    }
  };

  /**
   * 댓글 수정 이력 조회
   */
  static getEditHistory: RequestHandler = async (req: Request, res: Response) => {
    const expressReq = req as ExpressRequest;
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const history = await CommentService.getEditHistory(id, ((req as any).user as { id: string; email: string; role: string }).id);
      res.json({ history });
    } catch (error: any) {
      if (error.message === 'Comment not found' || error.message === 'Not authorized to view edit history') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to get edit history' });
    }
  };
}
