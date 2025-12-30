import { PrismaClient } from '@prisma/client';
import { downloadFile, uploadFile } from '../storage';
import { extractProcessor } from './extract';
import { classifyProcessor } from './classify';
import { ocrProcessor } from './ocr';

const prisma = new PrismaClient();

export type JobType = 'EXTRACT' | 'OCR' | 'CLASSIFY' | 'EMBED' | 'SUMMARIZE' | 'STUDENT_RECORD_ANALYZE';

/**
 * Process a job based on its type
 */
export async function processJob(
  jobId: string,
  fileId: string,
  ownerId: string,
  jobType: JobType
): Promise<void> {
  try {
    // Get file information
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    // Download file from uploads bucket
    const fileBuffer = await downloadFile('uploads', file.storagePath);

    // Process based on job type
    let outputs: Array<{ type: string; path: string; meta?: any }> = [];

    switch (jobType) {
      case 'EXTRACT':
        outputs = await extractProcessor(fileBuffer, file);
        break;
      case 'OCR':
        outputs = await ocrProcessor(fileBuffer, file);
        break;
      case 'CLASSIFY':
        outputs = await classifyProcessor(fileBuffer, file);
        break;
      case 'EMBED':
        // Placeholder for future implementation
        outputs = [];
        break;
      case 'SUMMARIZE':
        // Placeholder for future implementation
        outputs = [];
        break;
      case 'STUDENT_RECORD_ANALYZE':
        // Placeholder for future implementation
        outputs = [];
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    // Upload outputs to derivatives bucket and save to job_outputs
    for (const output of outputs) {
      // For now, create placeholder files
      const outputPath = `jobs/${jobId}/${output.type}_${Date.now()}.txt`;
      const outputBuffer = Buffer.from(JSON.stringify(output.meta || { placeholder: true }));

      await uploadFile('derivatives', outputPath, outputBuffer, 'text/plain');

      // Save to job_outputs table
      await prisma.jobOutput.create({
        data: {
          jobId,
          outputType: output.type as any,
          storagePath: outputPath,
          meta: output.meta || {},
        },
      });
    }

    // Update job status to SUCCEEDED
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'SUCCEEDED',
        finishedAt: new Date(),
      },
    });

    console.log(`Job ${jobId} completed successfully`);
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job status to FAILED
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message || 'Unknown error',
        finishedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }
}

