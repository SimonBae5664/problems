import { PrismaClient } from '@prisma/client';

// Prisma Client 설정 - Connection Pool 최적화
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 서버 시작 시 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    console.log('🔍 데이터베이스 연결 시도 중...');
    console.log('🔍 DATABASE_URL 호스트:', dbUrl?.match(/@([^:]+):/)?.[1] || 'unknown');
    console.log('🔍 DATABASE_URL 포트:', dbUrl?.match(/:(\d+)\//)?.[1] || 'unknown');
    
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 간단한 쿼리로 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 데이터베이스 쿼리 테스트 성공');
  } catch (error: any) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    console.error('🔍 DATABASE_URL 시작 부분:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    if (error.code) {
      console.error('🔍 에러 코드:', error.code);
    }
    if (error.meta) {
      console.error('🔍 에러 메타:', error.meta);
    }
    
    // 네트워크 연결 문제인지 확인
    if (error.message.includes("Can't reach database server")) {
      console.error('⚠️  네트워크 연결 문제로 보입니다.');
      console.error('⚠️  가능한 원인:');
      console.error('   1. Supabase 프로젝트가 일시 중지되었을 수 있음');
      console.error('   2. Render에서 Supabase로의 네트워크 연결이 차단되었을 수 있음');
      console.error('   3. Supabase 방화벽 설정 문제');
      console.error('   4. 연결 문자열이 잘못되었을 수 있음');
      console.error('💡 해결 방법:');
      console.error('   - Supabase 대시보드에서 프로젝트 상태 확인');
      console.error('   - Supabase → Settings → Database → Connection Pooling에서 URL 재확인');
      console.error('   - 연결 문자열을 다시 복사하여 Render에 붙여넣기');
    }
  }
}

// 서버 시작 시 연결 테스트 (비동기로 실행, 블로킹하지 않음)
testConnection().catch(console.error);

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

