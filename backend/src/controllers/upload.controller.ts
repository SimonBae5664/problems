import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getStorageService } from '../services/storage.service';

export class UploadController {
  /**
   * PDF 파일 업로드
   */
  static async uploadPdf(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const storageService = getStorageService();
      const fileUrl = await storageService.uploadFile(req.file, 'problems');

      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      if (error.message === 'Only PDF files are allowed') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 10MB limit' });
      }
      res.status(500).json({ error: 'File upload failed' });
    }
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'File URL is required' });
      }

      const storageService = getStorageService();
      await storageService.deleteFile(url);

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'File deletion failed' });
    }
  }
}

