import api from './api';

export const uploadService = {
  async uploadPdf(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string; filename: string; size: number }>(
      '/api/upload/pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

