import { PrismaClient } from '@prisma/client';

// Prisma Client 설정 - Connection Pool 최적화
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 서버 시작 시 데이터베이스 연결 테스트
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 간단한 쿼리로 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 데이터베이스 쿼리 테스트 성공');
  } catch (error: any) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    if (error.code) {
      console.error('에러 코드:', error.code);
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

