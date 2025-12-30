import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Initialize file upload
router.post('/init', authenticateToken, FileController.initUpload);

// Get signed download URL
router.post('/:id/signed-download', authenticateToken, FileController.getSignedDownloadUrl);

// List files
router.get('/', authenticateToken, FileController.listFiles);

// Delete file
router.delete('/:id', authenticateToken, FileController.deleteFile);

export default router;

