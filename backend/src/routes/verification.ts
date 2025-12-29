import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// 사용자 인증 요청
router.post(
  '/request',
  authenticateToken,
  [
    body('type')
      .isIn(['UNIVERSITY', 'HIGH_SCHOOL', 'QUALIFICATION'])
      .withMessage('Invalid verification type'),
    body('documentUrl')
      .optional()
      .isURL()
      .withMessage('Invalid document URL'),
  ],
  VerificationController.requestVerification
);

// 내 인증 상태 조회
router.get(
  '/me',
  authenticateToken,
  VerificationController.getMyVerifications
);

// 운영진: 대기 중인 인증 목록
router.get(
  '/pending',
  authenticateToken,
  requireAdmin,
  VerificationController.getPendingVerifications
);

// 운영진: 인증 승인
router.post(
  '/:id/approve',
  authenticateToken,
  requireAdmin,
  VerificationController.approveVerification
);

// 운영진: 인증 거부
router.post(
  '/:id/reject',
  authenticateToken,
  requireAdmin,
  [
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required'),
  ],
  VerificationController.rejectVerification
);

export default router;

