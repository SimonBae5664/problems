import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { processJob } from './processors';
import { getStorageClient } from './storage';

dotenv.config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '1', 10);

let isRunning = false;
let activeJobs = 0;

/**
 * Poll database for queued jobs and process them
 */
async function pollAndProcessJobs() {
  if (isRunning || activeJobs >= MAX_CONCURRENT_JOBS) {
    return;
  }

  try {
    // Use SELECT ... FOR UPDATE SKIP LOCKED to safely get a job
    // This ensures only one worker can pick up a job at a time
    const job = await prisma.$queryRaw<Array<{
      id: string;
      fileId: string;
      ownerId: string;
      jobType: string;
      status: string;
    }>>`
      SELECT id, "fileId", "ownerId", "jobType", status
      FROM "ProcessingJob"
      WHERE status = 'QUEUED'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (job.length === 0) {
      return; // No jobs available
    }

    const jobData = job[0];
    isRunning = true;
    activeJobs++;

    // Update job status to PROCESSING
    await prisma.processingJob.update({
      where: { id: jobData.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        lockedAt: new Date(),
      },
    });

    // Process the job asynchronously
    processJob(jobData.id, jobData.fileId, jobData.ownerId, jobData.jobType as any)
      .then(() => {
        activeJobs--;
        isRunning = false;
      })
      .catch((error) => {
        console.error(`Error processing job ${jobData.id}:`, error);
        activeJobs--;
        isRunning = false;
      });
  } catch (error) {
    console.error('Error polling for jobs:', error);
    isRunning = false;
  }
}

/**
 * Main worker loop
 */
async function startWorker() {
  console.log('Worker started');
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);

  // Start polling loop
  setInterval(() => {
    pollAndProcessJobs();
  }, POLL_INTERVAL);

  // Also poll immediately
  pollAndProcessJobs();
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the worker
startWorker().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});

