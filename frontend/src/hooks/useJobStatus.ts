import { useState, useEffect, useCallback } from 'react';
import { ProcessingJob } from '../types';
import { jobService } from '../services/job.service';

interface UseJobStatusOptions {
  jobId: string | null;
  pollInterval?: number; // milliseconds
  enabled?: boolean;
  onStatusChange?: (job: ProcessingJob) => void;
}

export function useJobStatus({
  jobId,
  pollInterval = 2000,
  enabled = true,
  onStatusChange,
}: UseJobStatusOptions) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobStatus(jobId);
      setJob(jobData);
      
      if (onStatusChange) {
        onStatusChange(jobData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch job status');
      setError(error);
      console.error('Error fetching job status:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId, enabled, onStatusChange]);

  useEffect(() => {
    if (!jobId || !enabled) {
      setJob(null);
      return;
    }

    // Fetch immediately
    fetchJobStatus();

    // Set up polling if job is not completed
    const interval = setInterval(() => {
      if (job && (job.status === 'QUEUED' || job.status === 'PROCESSING')) {
        fetchJobStatus();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, enabled, pollInterval, fetchJobStatus, job?.status]);

  return {
    job,
    loading,
    error,
    refetch: fetchJobStatus,
    isCompleted: job?.status === 'SUCCEEDED' || job?.status === 'FAILED',
    isProcessing: job?.status === 'PROCESSING' || job?.status === 'QUEUED',
  };
}

