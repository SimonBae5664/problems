export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Problem {
  id: string;
  title: string;
  description?: string;
  subject: string;
  difficulty?: string;
  pdfUrl: string;
  status: string;
  submittedById: string;
  submittedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  problemId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  parentId?: string;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  _count?: {
    replies: number;
    likes: number;
  };
}

export interface Verification {
  id: string;
  type: 'UNIVERSITY' | 'HIGH_SCHOOL' | 'QUALIFICATION';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  emailDomain?: string;
  documentUrl?: string;
  createdAt: string;
}

export interface File {
  id: string;
  ownerId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileExt: string;
  size: number;
  visibility: 'PRIVATE' | 'SHARED' | 'PUBLIC';
  createdAt: string;
  updatedAt: string;
  processingJobs?: ProcessingJob[];
}

export interface ProcessingJob {
  id: string;
  fileId: string;
  ownerId: string;
  jobType: 'EXTRACT' | 'OCR' | 'CLASSIFY' | 'EMBED' | 'SUMMARIZE' | 'STUDENT_RECORD_ANALYZE';
  status: 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  attempts: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  outputs?: JobOutput[];
}

export interface JobOutput {
  id: string;
  jobId: string;
  outputType: 'TEXT' | 'JSON' | 'THUMB' | 'EMBEDDING';
  storagePath: string;
  meta?: any;
  createdAt: string;
}

