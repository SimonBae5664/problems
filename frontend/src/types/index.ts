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

