import { PrismaClient } from '@prisma/client';

// Prisma Client 설정 - Connection Pool 최적화
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 서버 시작 시 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL이 설정되지 않았습니다!');
      return;
    }
    
    console.log('🔍 데이터베이스 연결 시도 중...');
    // URL 파싱 개선
    const urlMatch = dbUrl.match(/postgresql?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    const host = urlMatch?.[3] || 'unknown';
    const port = urlMatch?.[4] || 'unknown';
    const user = urlMatch?.[1] || 'unknown';
    const database = urlMatch?.[5] || 'unknown';
    
    console.log('🔍 연결 정보:');
    console.log('   호스트:', host);
    console.log('   포트:', port);
    console.log('   사용자:', user);
    console.log('   데이터베이스:', database);
    
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
    console.error('🔍 DATABASE_URL 시작 부분:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    if (error.code) {
      console.error('🔍 에러 코드:', error.code);
    }
    if (error.meta) {
      console.error('🔍 에러 메타:', JSON.stringify(error.meta, null, 2));
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
      console.error('💡 해결 방법:');
      console.error('   1. Supabase 대시보드에서 프로젝트 상태를 다시 확인 (Active인지)');
      console.error('   2. Supabase → Settings → Database → URI에서 연결 문자열 다시 복사');
      console.error('   3. Render에서 DATABASE_URL을 삭제하고 다시 추가');
      console.error('   4. Supabase 프로젝트를 재시작하거나 새로 생성 고려');
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

