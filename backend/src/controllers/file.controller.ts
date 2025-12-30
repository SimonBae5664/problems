import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { getStorageService } from '../services/storage.service';
import { v4 as uuidv4 } from 'uuid';

export class FileController {
  /**
   * Initialize file upload - create file record and get signed upload URL
   */
  static async initUpload(req: Request, res: Response) {
    try {
      const { filename, mimeType, size } = req.body;
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;

      if (!filename || !mimeType || !size) {
        return res.status(400).json({ error: 'filename, mimeType, and size are required' });
      }

      // Generate storage path
      const fileExtension = filename.split('.').pop();
      const storagePath = `uploads/${userId}/${uuidv4()}.${fileExtension}`;

      // Create file record
      const file = await prisma.file.create({
        data: {
          ownerId: userId,
          storagePath,
          originalFilename: filename,
          mimeType,
          fileExt: fileExtension || '',
          size: parseInt(size, 10),
          visibility: 'PRIVATE',
        },
      });

      // Get signed upload URL (for Supabase Storage)
      const storageService = getStorageService();
      let uploadUrl: string;

      try {
        // Try to create signed URL for upload
        // Note: Supabase doesn't support signed upload URLs directly
        // We'll return the file record and let the client upload directly using service role
        // For now, return a placeholder - actual upload will be handled server-side
        uploadUrl = storagePath; // This will be used by the client
      } catch (error) {
        // If signed URL creation fails, still return file record
        uploadUrl = storagePath;
      }

      res.json({
        fileId: file.id,
        storagePath: file.storagePath,
        uploadUrl,
        // For Supabase, client will need to upload using the API
        // We'll provide a separate endpoint for actual upload
      });
    } catch (error: any) {
      console.error('Error initializing upload:', error);
      res.status(500).json({ error: 'Failed to initialize upload' });
    }
  }

  /**
   * Get signed download URL for a file
   */
  static async getSignedDownloadUrl(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;
      const { expiresIn = 3600 } = req.query;

      const file = await prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check permissions
      if (file.ownerId !== userId && file.visibility === 'PRIVATE') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get signed URL from storage service
      const storageService = getStorageService();
      const signedUrl = await storageService.createSignedUrl(
        file.storagePath,
        parseInt(expiresIn as string, 10)
      );

      res.json({
        fileId: file.id,
        signedUrl,
        expiresIn: parseInt(expiresIn as string, 10),
      });
    } catch (error: any) {
      console.error('Error getting signed URL:', error);
      res.status(500).json({ error: 'Failed to get signed URL' });
    }
  }

  /**
   * List files for a user
   */
  static async listFiles(req: Request, res: Response) {
    try {
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;
      const { visibility, limit = 50, offset = 0 } = req.query;

      const where: any = { ownerId: userId };
      if (visibility) {
        where.visibility = visibility.toUpperCase();
      }

      const files = await prisma.file.findMany({
        where,
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        orderBy: { createdAt: 'desc' },
        include: {
          processingJobs: {
            select: {
              id: true,
              jobType: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1, // Latest job
          },
        },
      });

      res.json({ files });
    } catch (error: any) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;

      const file = await prisma.file.findUnique({
        where: { id },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.ownerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Delete from storage
      const storageService = getStorageService();
      await storageService.deleteFile(file.storagePath);

      // Delete file record (cascade will delete related jobs and outputs)
      await prisma.file.delete({
        where: { id },
      });

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
}

