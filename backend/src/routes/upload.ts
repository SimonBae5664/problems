import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// PDF 파일 업로드 (인증 필요)
router.post(
  '/pdf',
  authenticateToken,
  upload.single('file'),
  UploadController.uploadPdf
);

// 파일 삭제 (인증 필요)
router.delete(
  '/',
  authenticateToken,
  UploadController.deleteFile
);

export default router;

