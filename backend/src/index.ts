// IPv4 우선 DNS 설정 (Session Pooler IPv4 호환성)
// Node.js가 IPv6를 먼저 시도하는 것을 방지하고 IPv4를 우선시
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
console.log('🌐 DNS order:', dns.getDefaultResultOrder());

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
import { prisma } from './utils/prisma';

// Development에서만 .env 파일 로드 (production에서는 환경 변수 사용)
// override: false로 설정하여 환경 변수가 .env를 덮어쓰도록 함
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// JWT_SECRET 검증 (서버 시작 시)
const validateJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret || jwtSecret === 'default-secret') {
    console.error('❌ JWT_SECRET이 설정되지 않았거나 기본값입니다!');
    console.error('Render 대시보드에서 JWT_SECRET 환경 변수를 설정해주세요.');
    console.error('⚠️  보안을 위해 최소 32바이트 (256bit)의 랜덤 문자열을 사용하세요.');
    console.error('💡 생성 방법: openssl rand -hex 32 (64글자 = 32바이트)');
    return;
  }
  
  // 바이트 길이로 검증 (UTF-8 인코딩 기준)
  const byteLength = Buffer.byteLength(jwtSecret, 'utf8');
  
  if (byteLength < 32) {
    console.error('❌ JWT_SECRET이 너무 짧습니다!');
    console.error(`현재 바이트 길이: ${byteLength}바이트`);
    console.error('⚠️  보안을 위해 최소 32바이트 (256bit)를 사용하세요.');
    console.error('💡 생성 방법: openssl rand -hex 32 (64글자 = 32바이트)');
    return;
  }
  
  console.log(`✅ JWT_SECRET 검증 통과 (${byteLength}바이트, ${jwtSecret.length}자)`);
};

validateJwtSecret();

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
    // 비밀번호 마스킹
    const masked = dbUrl.length > 50 ? dbUrl.substring(0, 50) + '...' : dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.error('현재 값:', masked);
  }
  
  // URL 파싱하여 사용자명 확인 (비밀번호 마스킹)
  try {
    const url = new URL(dbUrl);
    console.log('🔍 DATABASE_URL 검증:');
    console.log('   사용자명:', url.username);
    console.log('   호스트:', url.hostname);
    console.log('   포트:', url.port || '5432');
    
    // 🔍 진단: PATHNAME과 SEARCH 확인 (ChatGPT 제안)
    console.log('🔍 URL 파싱 진단:');
    console.log('   PATHNAME:', url.pathname); // "/postgres" 여야 함
    console.log('   SEARCH:', url.search);     // "?sslmode=require&connect_timeout=..." 여야 함
    
    // PATHNAME에 ?가 포함되어 있으면 URL이 깨진 것
    if (url.pathname.includes('?')) {
      console.error('❌ PATHNAME에 ?가 포함되어 있습니다! URL이 깨졌습니다.');
      console.error('❌ PATHNAME:', url.pathname);
      console.error('💡 Render에서 DATABASE_URL을 삭제하고 다시 추가하세요.');
      console.error('💡 앞뒤 공백, 줄바꿈, 따옴표 없이 한 줄로 붙여넣으세요.');
    }
    
    // SEARCH가 비어있으면 파라미터가 PATHNAME에 포함된 것
    if (!url.search && dbUrl.includes('?')) {
      console.error('❌ URL 파라미터가 PATHNAME에 포함되어 있습니다!');
      console.error('❌ PATHNAME:', url.pathname);
      console.error('💡 Render에서 DATABASE_URL 형식을 확인하세요.');
    }
    
    // Session Pooler 사용자명 검증
    if (url.hostname.includes('pooler') && !url.username.includes('.')) {
      console.error('❌ Session Pooler를 사용 중이지만 사용자명이 잘못되었습니다!');
      console.error('❌ 올바른 형식: postgres.<project-ref>');
      console.error('❌ 현재 사용자명:', url.username);
      console.error('💡 Supabase → Settings → Database → Connection Pooling → Session mode');
      console.error('💡 Copy 버튼으로 URL을 복사하세요.');
    }
  } catch (e) {
    console.warn('⚠️  DATABASE_URL 파싱 실패 (형식 확인 필요)');
    console.error('⚠️  에러:', e);
  }
  
  // Connection Pooler 사용 중인지 확인
  if (dbUrl.includes(':6543') || dbUrl.includes('pooler')) {
    // Session Pooler vs Transaction Pooler 구분
    if (dbUrl.includes('pooler.supabase.com') && !dbUrl.includes('transaction')) {
      console.log('✅ Session Pooler를 사용하고 있습니다. (포트 6543, IPv4 지원)');
      console.log('✅ Session Pooler는 IPv4 네트워크와 호환되며 연결 풀링을 제공합니다.');
      console.log('✅ 최대 200개 동시 연결 지원');
    } else if (dbUrl.includes('transaction')) {
      console.log('⚠️  Transaction Pooler를 사용하고 있습니다.');
      console.warn('⚠️  Transaction Pooler는 IPv6만 지원합니다.');
      console.warn('⚠️  Render의 IPv4 네트워크와 호환되지 않을 수 있습니다.');
      console.warn('💡 Session Pooler 사용을 권장합니다 (IPv4 지원).');
    } else {
      console.log('✅ Connection Pooler를 사용하고 있습니다. (포트 6543)');
    }
    
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
    console.log('💡 Session Pooler 사용을 권장합니다:');
    console.log('   - IPv4 지원 (Render와 호환)');
    console.log('   - 연결 풀링 (최대 200개 동시 연결)');
    console.log('   - 성능 향상');
    console.log('   - Supabase → Settings → Database → Connection Pooling → Session mode');
  }
  
  // URL에 잘못된 파라미터가 있는지 확인
  if (dbUrl.includes('?pgbouncer=true')) {
    console.warn('⚠️  ?pgbouncer=true 파라미터가 포함되어 있습니다.');
    console.warn('⚠️  Prisma는 이 파라미터를 인식하지 못할 수 있습니다.');
    console.warn('⚠️  ?pgbouncer=true를 제거하고 다시 시도해보세요.');
  }
  
  // Connection pool 파라미터 확인
  const connectionLimitMatch = dbUrl.match(/connection_limit=(\d+)/);
  const poolTimeoutMatch = dbUrl.match(/pool_timeout=(\d+)/);
  
  if (!connectionLimitMatch || !poolTimeoutMatch) {
    console.warn('⚠️  Connection pool 파라미터가 없거나 불완전합니다.');
    console.warn('⚠️  연결 풀 타임아웃을 방지하려면 다음 파라미터를 추가하세요:');
    console.warn('⚠️  ?connection_limit=1&pool_timeout=30 (테스트용, 작은 값)');
    console.warn('⚠️  또는 ?connection_limit=5&pool_timeout=20 (프로덕션용)');
  } else {
    const limit = connectionLimitMatch[1];
    const timeout = poolTimeoutMatch[1];
    console.log(`✅ Connection pool 설정: limit=${limit}, timeout=${timeout}초`);
    
    // connection_limit이 너무 크면 경고
    if (parseInt(limit, 10) > 10) {
      console.warn('⚠️  connection_limit이 10보다 큽니다.');
      console.warn('⚠️  Supabase 무료 플랜 제한을 고려하여 5 이하로 권장합니다.');
    }
    
    // connection_limit이 1이면 테스트 모드
    if (parseInt(limit, 10) === 1) {
      console.log('ℹ️  connection_limit=1로 설정되어 있습니다. (테스트 모드)');
      console.log('ℹ️  단일 연결로 문제를 격리할 수 있습니다.');
    }
  }
};

// 서버 시작 시 데이터베이스 URL 검증
validateDatabaseUrl();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy 설정 (Render 등 프록시 뒤에서 실행 시 실제 클라이언트 IP를 얻기 위해)
app.set('trust proxy', 1);

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

// 요청 로그 미들웨어 (connection pool 문제 진단용)
// 중복 요청 감지를 위해 경로, 시간, IP, 이메일(회원가입인 경우) 로깅
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  // trust proxy 설정 후 req.ip가 실제 클라이언트 IP를 반환
  // x-forwarded-for 헤더도 확인 (여러 프록시를 거친 경우)
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = req.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || req.connection.remoteAddress || 'unknown';
  
  // 회원가입 요청인 경우 이메일도 로깅 (중복 호출 감지용)
  if (req.path === '/api/auth/register' && req.method === 'POST') {
    const email = req.body?.email || 'unknown';
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip} - Email: ${email}`);
  } else {
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  }
  next();
});

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

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    // 싱글톤 prisma 인스턴스 사용 (동적 import 불필요)
    // 간단한 쿼리로 연결 테스트
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

