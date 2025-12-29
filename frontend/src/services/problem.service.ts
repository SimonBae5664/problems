import api from './api';
import { Problem } from '../types';

export const problemService = {
  async getProblems(params?: {
    page?: number;
    limit?: number;
    subject?: string;
    difficulty?: string;
  }) {
    const response = await api.get<{
      problems: Problem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/problems', { params });
    return response.data;
  },

  async getProblemById(id: string) {
    const response = await api.get<{ problem: Problem }>(`/api/problems/${id}`);
    return response.data.problem;
  },

  async createProblem(data: {
    title: string;
    description?: string;
    subject: string;
    difficulty?: string;
    pdfUrl: string;
  }) {
    const response = await api.post<{ problem: Problem }>('/api/problems', data);
    return response.data.problem;
  },

  async getMyProblems(params?: { page?: number; limit?: number }) {
    const response = await api.get<{
      problems: Problem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/problems/me/list', { params });
    return response.data;
  },

  async getPendingProblems(params?: { page?: number; limit?: number }) {
    const response = await api.get<{
      problems: Problem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/api/problems/admin/pending', { params });
    return response.data;
  },

  async approveProblem(id: string) {
    const response = await api.post<{ problem: Problem }>(`/api/problems/admin/${id}/approve`);
    return response.data.problem;
  },

  async rejectProblem(id: string, reason: string) {
    const response = await api.post<{ problem: Problem }>(`/api/problems/admin/${id}/reject`, { reason });
    return response.data.problem;
  },

  async startReview(id: string) {
    const response = await api.post<{ problem: Problem }>(`/api/problems/admin/${id}/review`);
    return response.data.problem;
  },
};

