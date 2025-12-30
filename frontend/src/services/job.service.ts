import api from './api';
import { ProcessingJob } from '../types';

export interface CreateJobRequest {
  fileId: string;
  jobType: 'EXTRACT' | 'OCR' | 'CLASSIFY' | 'EMBED' | 'SUMMARIZE' | 'STUDENT_RECORD_ANALYZE';
}

export interface CreateJobResponse {
  id: string;
  fileId: string;
  jobType: string;
  status: string;
  createdAt: string;
}

export const jobService = {
  /**
   * Create a processing job
   */
  async createJob(data: CreateJobRequest): Promise<CreateJobResponse> {
    const response = await api.post<CreateJobResponse>('/api/jobs/create', data);
    return response.data;
  },

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    const response = await api.get<ProcessingJob>(`/api/jobs/${jobId}`);
    return response.data;
  },

  /**
   * List jobs for the current user
   */
  async listJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: ProcessingJob[] }> {
    const response = await api.get<{ jobs: ProcessingJob[] }>('/api/jobs', { params });
    return response.data;
  },
};

