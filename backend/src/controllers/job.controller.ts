import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export class JobController {
  /**
   * Create a processing job for a file
   */
  static async createJob(req: Request, res: Response) {
    try {
      const { fileId, jobType } = req.body;
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;

      if (!fileId || !jobType) {
        return res.status(400).json({ error: 'fileId and jobType are required' });
      }

      // Verify file ownership
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.ownerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Create processing job
      const job = await prisma.processingJob.create({
        data: {
          fileId,
          ownerId: userId,
          jobType: jobType.toUpperCase(),
          status: 'QUEUED',
        },
      });

      res.json({
        id: job.id,
        fileId: job.fileId,
        jobType: job.jobType,
        status: job.status,
        createdAt: job.createdAt,
      });
    } catch (error: any) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;

      const job = await prisma.processingJob.findUnique({
        where: { id },
        include: {
          outputs: {
            select: {
              id: true,
              outputType: true,
              storagePath: true,
              meta: true,
              createdAt: true,
            },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Verify ownership
      if (job.ownerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({
        id: job.id,
        fileId: job.fileId,
        jobType: job.jobType,
        status: job.status,
        attempts: job.attempts,
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
        outputs: job.outputs,
      });
    } catch (error: any) {
      console.error('Error getting job status:', error);
      res.status(500).json({ error: 'Failed to get job status' });
    }
  }

  /**
   * List jobs for a user
   */
  static async listJobs(req: Request, res: Response) {
    try {
      const userId = ((req as any).user as { id: string; email: string; role: string })!.id;
      const { status, limit = 50, offset = 0 } = req.query;

      const where: any = { ownerId: userId };
      if (status) {
        where.status = status.toUpperCase();
      }

      const jobs = await prisma.processingJob.findMany({
        where,
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileId: true,
          jobType: true,
          status: true,
          attempts: true,
          error: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
        },
      });

      res.json({ jobs });
    } catch (error: any) {
      console.error('Error listing jobs:', error);
      res.status(500).json({ error: 'Failed to list jobs' });
    }
  }
}

