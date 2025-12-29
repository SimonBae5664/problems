import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/auth';
import { body, query, param } from 'express-validator';

const router = Router();

// 댓글 목록 조회 (인증 불필요)
router.get(
  '/problem/:problemId',
  [
    param('problemId').isUUID().withMessage('Invalid problem ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortOrder').optional().isIn(['NEWEST', 'OLDEST', 'MOST_LIKED']),
    query('includeReplies').optional().isBoolean(),
  ],
  CommentController.getComments
);

// 댓글 작성 (인증 필요)
router.post(
  '/',
  authenticateToken,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content is required and must be less than 2000 characters'),
    body('problemId').isUUID().withMessage('Invalid problem ID'),
    body('parentId').optional().isUUID().withMessage('Invalid parent comment ID'),
  ],
  CommentController.createComment
);

// 댓글 수정 (인증 필요)
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid comment ID'),
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content is required and must be less than 2000 characters'),
  ],
  CommentController.updateComment
);

// 댓글 삭제 (인증 필요)
router.delete(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid comment ID'),
  ],
  CommentController.deleteComment
);

// 댓글 좋아요/싫어요 (인증 필요)
router.post(
  '/:id/like',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid comment ID'),
    body('isLike').isBoolean().withMessage('isLike must be a boolean'),
  ],
  CommentController.toggleLike
);

// 댓글 수정 이력 조회 (인증 필요, 작성자만)
router.get(
  '/:id/history',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid comment ID'),
  ],
  CommentController.getEditHistory
);

export default router;

