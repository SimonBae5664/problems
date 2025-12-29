import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body, query } from 'express-validator';

const router = Router();

// 공개된 문제 목록 (인증 불필요)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('subject').optional().isIn(['KOREAN', 'MATH', 'ENGLISH', 'KOREAN_HISTORY', 'SOCIAL_STUDIES', 'SCIENCE', 'SECOND_LANGUAGE']),
    query('difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD']),
  ],
  ProblemController.getPublishedProblems
);

// 문제 상세 조회 (인증 불필요, 단 공개된 문제만)
router.get(
  '/:id',
  ProblemController.getProblemById
);

// 문제 제출 (인증 필요)
router.post(
  '/',
  authenticateToken,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('subject').isIn(['KOREAN', 'MATH', 'ENGLISH', 'KOREAN_HISTORY', 'SOCIAL_STUDIES', 'SCIENCE', 'SECOND_LANGUAGE']).withMessage('Invalid subject'),
    body('difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Invalid difficulty'),
    body('pdfUrl').isURL().withMessage('Valid PDF URL is required'),
  ],
  ProblemController.createProblem
);

// 내가 제출한 문제 목록 (인증 필요)
router.get(
  '/me/list',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ProblemController.getMyProblems
);

// 운영진: 대기 중인 문제 목록
router.get(
  '/admin/pending',
  authenticateToken,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ProblemController.getPendingProblems
);

// 운영진: 검수 시작
router.post(
  '/admin/:id/review',
  authenticateToken,
  requireAdmin,
  ProblemController.startReview
);

// 운영진: 문제 승인
router.post(
  '/admin/:id/approve',
  authenticateToken,
  requireAdmin,
  ProblemController.approveProblem
);

// 운영진: 문제 거부
router.post(
  '/admin/:id/reject',
  authenticateToken,
  requireAdmin,
  [
    body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('Rejection reason is required and must be less than 500 characters'),
  ],
  ProblemController.rejectProblem
);

export default router;

