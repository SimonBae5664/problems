import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Create a processing job
router.post('/create', authenticateToken, JobController.createJob);

// Get job status
router.get('/:id', authenticateToken, JobController.getJobStatus);

// List jobs for user
router.get('/', authenticateToken, JobController.listJobs);

export default router;

