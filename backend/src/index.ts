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

// 데이터베이스 연결 문자열 검증 및 변환
const validateDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다!');
    console.error('Render 대시보드에서 DATABASE_URL을 설정해주세요.');
    return;
  }
  
  // URL 형식 검증
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL은 postgresql:// 또는 postgres://로 시작해야 합니다.');
    console.error('현재 값:', dbUrl.substring(0, 50) + '...');
  }
  
  // Connection Pooler 사용 중인지 확인
  if (dbUrl.includes(':6543') || dbUrl.includes('pooler')) {
    console.log('✅ Connection Pooler를 사용하고 있습니다.');
    if (!directUrl) {
      console.warn('⚠️  DIRECT_URL이 설정되지 않았습니다.');
      console.warn('⚠️  Prisma는 Connection Pooler와 Direct connection을 모두 필요로 합니다.');
      console.warn('📖 Render에서 DIRECT_URL 환경 변수를 추가하세요.');
      console.warn('📖 DIRECT_URL은 포트 5432를 사용하는 Direct connection URL이어야 합니다.');
    } else {
      console.log('✅ DIRECT_URL이 설정되어 있습니다.');
    }
  } else if (dbUrl.includes(':5432')) {
    console.log('ℹ️  Direct connection (포트 5432)을 사용하고 있습니다.');
    console.log('ℹ️  Connection Pooler 사용을 권장하지만, Direct connection도 작동합니다.');
  }
  
  // URL에 잘못된 파라미터가 있는지 확인
  if (dbUrl.includes('?pgbouncer=true')) {
    console.warn('⚠️  ?pgbouncer=true 파라미터가 포함되어 있습니다.');
    console.warn('⚠️  Prisma는 이 파라미터를 인식하지 못할 수 있습니다.');
    console.warn('⚠️  ?pgbouncer=true를 제거하고 다시 시도해보세요.');
  }
  
  // Connection pool 파라미터 확인
  if (!dbUrl.includes('connection_limit') && !dbUrl.includes('pool_timeout')) {
    console.warn('⚠️  Connection pool 파라미터가 없습니다.');
    console.warn('⚠️  연결 풀 타임아웃을 방지하려면 다음 파라미터를 추가하세요:');
    console.warn('⚠️  ?connection_limit=10&pool_timeout=20');
  }
};

// 서버 시작 시 데이터베이스 URL 검증
validateDatabaseUrl();

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

