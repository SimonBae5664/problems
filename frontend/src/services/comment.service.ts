import api from './api';
import { Comment } from '../types';

export const commentService = {
  async getComments(problemId: string, params?: {
    page?: number;
    limit?: number;
    sortOrder?: 'NEWEST' | 'OLDEST' | 'MOST_LIKED';
    includeReplies?: boolean;
  }) {
    const response = await api.get<{
      comments: Comment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/comments/problem/${problemId}`, { params });
    return response.data;
  },

  async createComment(data: {
    content: string;
    problemId: string;
    parentId?: string;
  }) {
    const response = await api.post<{ comment: Comment }>('/api/comments', data);
    return response.data.comment;
  },

  async updateComment(id: string, content: string) {
    const response = await api.put<{ comment: Comment }>(`/api/comments/${id}`, { content });
    return response.data.comment;
  },

  async deleteComment(id: string) {
    await api.delete(`/api/comments/${id}`);
  },

  async toggleLike(id: string, isLike: boolean) {
    const response = await api.post<{ comment: Comment }>(`/api/comments/${id}/like`, { isLike });
    return response.data.comment;
  },
};

