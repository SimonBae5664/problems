#!/usr/bin/env node

/**
 * Supabase 연결 상태 체크 스크립트
 * 사용법: node check-supabase.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSupabase() {
  console.log('🔍 Supabase 연결 상태 확인 중...\n');

  // 1. 환경 변수 확인
  console.log('1️⃣ 환경 변수 확인:');
  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL이 설정되지 않았습니다!');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.warn('⚠️  SUPABASE_URL이 설정되지 않았습니다.');
  } else {
    console.log(`   ✅ SUPABASE_URL: ${supabaseUrl}`);
  }

  // DATABASE_URL에서 호스트 정보 추출
  const urlMatch = dbUrl.match(/postgresql?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (urlMatch) {
    const host = urlMatch[3];
    const port = urlMatch[4];
    const database = urlMatch[5];
    console.log(`   ✅ DATABASE_URL 호스트: ${host}:${port}`);
    console.log(`   ✅ 데이터베이스: ${database}`);
  } else {
    console.log(`   ⚠️  DATABASE_URL 형식을 파싱할 수 없습니다`);
  }

  console.log('');

  // 2. Prisma 연결 테스트
  console.log('2️⃣ Prisma 데이터베이스 연결 테스트:');
  try {
    const startTime = Date.now();
    await prisma.$connect();
    const connectTime = Date.now() - startTime;
    console.log(`   ✅ 연결 성공! (${connectTime}ms)`);

    // 3. 간단한 쿼리 테스트
    console.log('');
    console.log('3️⃣ 데이터베이스 쿼리 테스트:');
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
    console.log(`   ✅ PostgreSQL 버전: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    console.log(`   ✅ 현재 데이터베이스: ${result[0].database}`);
    console.log(`   ✅ 현재 사용자: ${result[0].user}`);

    // 4. 테이블 목록 확인
    console.log('');
    console.log('4️⃣ 테이블 목록 확인:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    if (tables.length > 0) {
      console.log(`   ✅ 발견된 테이블 (${tables.length}개):`);
      tables.forEach((table, index) => {
        console.log(`      ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('   ⚠️  테이블이 없습니다. 마이그레이션을 실행하세요.');
    }

    // 5. Supabase REST API 테스트 (선택사항)
    if (supabaseUrl) {
      console.log('');
      console.log('5️⃣ Supabase REST API 테스트:');
      try {
        const https = require('https');
        const url = new URL(supabaseUrl);
        
        const response = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: url.hostname,
            path: '/rest/v1/',
            method: 'GET',
            headers: {
              'apikey': 'dummy',
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }, (res) => {
            resolve(res);
          });
          
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
          
          req.end();
        });

        if (response.statusCode === 401) {
          console.log(`   ✅ Supabase REST API 응답: ${response.statusCode} (인증 필요 - 정상)`);
          console.log('   ℹ️  서버가 정상 작동 중입니다. API 키가 필요합니다.');
        } else {
          console.log(`   ✅ Supabase REST API 응답: ${response.statusCode}`);
        }
      } catch (error) {
        console.log(`   ⚠️  REST API 테스트 실패: ${error.message}`);
      }
    }

    console.log('');
    console.log('✅ 모든 테스트 통과! Supabase가 정상적으로 작동하고 있습니다.');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ 연결 실패!');
    console.error(`   오류 메시지: ${error.message}`);
    
    if (error.code) {
      console.error(`   오류 코드: ${error.code}`);
    }

    // 일반적인 오류 원인 안내
    console.error('');
    console.error('💡 가능한 원인:');
    if (error.message.includes('Authentication failed')) {
      console.error('   1. 데이터베이스 비밀번호가 잘못되었습니다.');
      console.error('   2. Supabase 대시보드에서 비밀번호를 확인하세요.');
      console.error('   3. DATABASE_URL의 비밀번호가 올바른지 확인하세요.');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('   1. Supabase 프로젝트가 일시 중지되었을 수 있습니다.');
      console.error('   2. Supabase 대시보드에서 프로젝트 상태를 확인하세요.');
      console.error('   3. 네트워크 연결을 확인하세요.');
    } else if (error.message.includes('connection pool')) {
      console.error('   1. Connection pool이 고갈되었습니다.');
      console.error('   2. DATABASE_URL에 connection_limit 파라미터를 추가하세요.');
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

checkSupabase();

