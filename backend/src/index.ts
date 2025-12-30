import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from 'passport';
import authRoutes from './routes/auth';
import verificationRoutes from './routes/verification';
import uploadRoutes from './routes/upload';
import problemRoutes from './routes/problems';
import commentRoutes from './routes/comments';
import jobRoutes from './routes/jobs';
import fileRoutes from './routes/files';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

// CORS 미들웨어 설정 (helmet보다 먼저)
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 (같은 도메인 요청 등) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 개발 환경에서는 모든 origin 허용 (선택사항)
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Helmet 설정 (CORS와 호환되도록)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint (CORS 적용 전에)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

