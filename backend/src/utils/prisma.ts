import { PrismaClient } from '@prisma/client';

// Connection pool 설정 파싱
const getConnectionPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  const connectionLimitMatch = dbUrl.match(/connection_limit=(\d+)/);
  const poolTimeoutMatch = dbUrl.match(/pool_timeout=(\d+)/);
  
  const connectionLimit = connectionLimitMatch 
    ? parseInt(connectionLimitMatch[1], 10) 
    : 1; // 기본값을 1로 낮춤 (테스트용)
  
  const poolTimeout = poolTimeoutMatch 
    ? parseInt(poolTimeoutMatch[1], 10) 
    : 20;
  
  console.log('🔧 Connection Pool 설정:');
  console.log(`   connection_limit: ${connectionLimit}`);
  console.log(`   pool_timeout: ${poolTimeout}초`);
  
  return { connectionLimit, poolTimeout };
};

const poolConfig = getConnectionPoolConfig();

// PrismaClient 싱글톤 패턴
// 요청마다 새 PrismaClient를 만들지 않고 하나의 인스턴스만 사용
// 이렇게 하면 connection pool이 효율적으로 관리되고 연결이 재사용됨
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// 주의: datasources.url을 명시적으로 설정하지 않음
// Prisma는 schema.prisma의 env("DATABASE_URL")을 자동으로 읽습니다
// 명시적으로 설정하면 환경 변수와 충돌할 수 있습니다
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Development에서만 global에 저장 (Hot reload 시 재사용)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 서버 시작 시 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL이 설정되지 않았습니다!');
      return;
    }
    
    console.log('🔍 데이터베이스 연결 시도 중...');
    
    // URL 파싱 (비밀번호 마스킹)
    let parsedUrl;
    try {
      parsedUrl = new URL(dbUrl);
    } catch (e) {
      // URL 파싱 실패 시 정규식으로 파싱
      const urlMatch = dbUrl.match(/postgresql?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (urlMatch) {
        parsedUrl = {
          username: urlMatch[1],
          password: '***',
          hostname: urlMatch[3],
          port: urlMatch[4],
          pathname: urlMatch[5],
        } as any;
      }
    }
    
    const host = parsedUrl?.hostname || 'unknown';
    const port = parsedUrl?.port || 'unknown';
    const user = parsedUrl?.username || 'unknown';
    const database = parsedUrl?.pathname?.replace('/', '') || 'unknown';
    
    // Connection pool 파라미터 확인
    const connectionLimitMatch = dbUrl.match(/connection_limit=(\d+)/);
    const poolTimeoutMatch = dbUrl.match(/pool_timeout=(\d+)/);
    const connectionLimit = connectionLimitMatch ? connectionLimitMatch[1] : '없음';
    const poolTimeout = poolTimeoutMatch ? poolTimeoutMatch[1] : '없음';
    
    console.log('🔍 연결 정보 (비밀번호 마스킹됨):');
    console.log('   호스트:', host);
    console.log('   포트:', port);
    console.log('   사용자:', user);
    console.log('   데이터베이스:', database);
    console.log('   connection_limit:', connectionLimit);
    console.log('   pool_timeout:', poolTimeout, '초');
    
    // Session Pooler 사용자명 검증
    if (user.includes('.') && host.includes('pooler')) {
      console.log('✅ Session Pooler 형식 사용자명 확인됨:', user);
    } else if (host.includes('pooler') && !user.includes('.')) {
      console.warn('⚠️  Session Pooler를 사용 중이지만 사용자명이 postgres.<ref> 형식이 아닙니다.');
      console.warn('⚠️  Supabase → Settings → Database → Connection Pooling → Session mode URL을 확인하세요.');
    }
    
    // 연결 타임아웃 설정
    const startTime = Date.now();
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    const connectTime = Date.now() - startTime;
    console.log(`✅ 데이터베이스 연결 성공 (${connectTime}ms)`);
    
    // 간단한 쿼리로 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 데이터베이스 쿼리 테스트 성공');
  } catch (error: any) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    
    // 비밀번호 마스킹 처리
    const dbUrl = process.env.DATABASE_URL || '';
    let maskedUrl = dbUrl;
    try {
      const url = new URL(dbUrl);
      if (url.password) {
        maskedUrl = dbUrl.replace(`:${url.password}@`, ':****@');
      }
    } catch (e) {
      // URL 파싱 실패 시 정규식으로 마스킹
      maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    }
    console.error('🔍 DATABASE_URL (비밀번호 마스킹):', maskedUrl.substring(0, 100) + '...');
    
    // Prisma가 실제로 사용하는 URL 확인
    console.log('🔍 Prisma가 사용하는 URL 확인:');
    try {
      const url = new URL(process.env.DATABASE_URL || '');
      console.log('   사용자명:', url.username);
      console.log('   호스트:', url.hostname);
      console.log('   포트:', url.port || '5432');
      console.log('   데이터베이스:', url.pathname.replace('/', ''));
      
      // Session Pooler 검증
      if (url.hostname.includes('pooler') && !url.username.includes('.')) {
        console.error('❌ Session Pooler를 사용 중이지만 사용자명이 잘못되었습니다!');
        console.error('❌ 올바른 형식: postgres.<project-ref>');
        console.error('❌ 현재 사용자명:', url.username);
        console.error('💡 Supabase → Settings → Database → Connection Pooling → Session mode URL을 복사하세요.');
      }
    } catch (e) {
      console.error('   URL 파싱 실패');
    }
    if (error.code) {
      console.error('🔍 에러 코드:', error.code);
    }
    if (error.meta) {
      console.error('🔍 에러 메타:', JSON.stringify(error.meta, null, 2));
    }
    
    // Connection pool 관련 에러인지 확인
    if (error.message.includes("Timed out fetching a new connection") ||
        error.message.includes("connection pool")) {
      console.error('⚠️  Connection Pool 문제로 보입니다.');
      console.error('⚠️  가능한 원인:');
      console.error('   1. connection_limit이 너무 작거나 너무 큼');
      console.error('   2. 동시 연결 수가 Supabase 제한을 초과');
      console.error('   3. 연결이 제대로 해제되지 않아 pool이 고갈됨');
      console.error('💡 해결 방법:');
      console.error('   1. DATABASE_URL에 connection_limit=1&pool_timeout=30 추가 (테스트용)');
      console.error('   2. Supabase 무료 플랜: Direct connection 최대 60개, Pooler 최대 200개');
      console.error('   3. Render에서 DATABASE_URL 확인: connection_limit 파라미터 확인');
    }
    
    // 네트워크 연결 문제인지 확인
    if (error.message.includes("Can't reach database server") || 
        error.message.includes("Connection refused") ||
        error.message.includes("timeout")) {
      console.error('⚠️  네트워크 연결 문제로 보입니다.');
      console.error('⚠️  가능한 원인:');
      console.error('   1. Supabase 프로젝트가 실제로는 일시 중지되었을 수 있음 (healthy 표시와 다를 수 있음)');
      console.error('   2. Render에서 Supabase로의 네트워크 연결이 차단되었을 수 있음');
      console.error('   3. Supabase 방화벽 설정 문제');
      console.error('   4. 연결 문자열이 잘못되었을 수 있음');
      console.error('   5. Supabase 프로젝트가 삭제되었거나 접근 불가능한 상태일 수 있음');
      console.error('   6. Connection pool이 고갈되어 새 연결을 만들 수 없음');
      console.error('💡 해결 방법:');
      console.error('   1. Supabase 대시보드에서 프로젝트 상태를 다시 확인 (Active인지)');
      console.error('   2. Supabase → Settings → Database → URI에서 연결 문자열 다시 복사');
      console.error('   3. Render에서 DATABASE_URL을 삭제하고 다시 추가');
      console.error('   4. connection_limit=1로 낮춰서 테스트 (단일 연결로 문제 격리)');
      console.error('   5. Supabase 프로젝트를 재시작하거나 새로 생성 고려');
    }
  }
}

// 서버 시작 시 연결 테스트 (비동기로 실행, 블로킹하지 않음)
testConnection().catch(console.error);

// Graceful shutdown
// 주의: 요청마다 $disconnect()를 호출하면 안 됩니다!
// 서버 종료 시에만 연결을 끊어야 합니다.
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// SIGTERM, SIGINT 시그널 처리 (Docker, PM2 등에서 사용)
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

