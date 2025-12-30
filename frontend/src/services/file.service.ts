import api from './api';
import { File } from '../types';

export interface InitUploadRequest {
  filename: string;
  mimeType: string;
  size: number;
}

export interface InitUploadResponse {
  fileId: string;
  storagePath: string;
  uploadUrl: string;
}

export interface SignedDownloadUrlResponse {
  fileId: string;
  signedUrl: string;
  expiresIn: number;
}

export const fileService = {
  /**
   * Initialize file upload - create file record and get upload URL
   */
  async initUpload(data: InitUploadRequest): Promise<InitUploadResponse> {
    const response = await api.post<InitUploadResponse>('/api/files/init', data);
    return response.data;
  },

  /**
   * Get signed download URL for a file
   */
  async getSignedDownloadUrl(
    fileId: string,
    expiresIn: number = 3600
  ): Promise<SignedDownloadUrlResponse> {
    const response = await api.post<SignedDownloadUrlResponse>(
      `/api/files/${fileId}/signed-download`,
      {},
      { params: { expiresIn } }
    );
    return response.data;
  },

  /**
   * List files for the current user
   */
  async listFiles(params?: {
    visibility?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ files: File[] }> {
    const response = await api.get<{ files: File[] }>('/api/files', { params });
    return response.data;
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/api/files/${fileId}`);
  },
};

