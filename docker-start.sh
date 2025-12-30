#!/bin/bash

echo "🐳 Docker로 수능 문제 공유 커뮤니티 시작하기"
echo ""

# .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다!"
    echo ""
    echo "프로젝트 루트에 .env 파일을 생성하고 다음 변수들을 설정하세요:"
    echo ""
    echo "  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
    echo "  JWT_SECRET=your-super-secret-jwt-key"
    echo "  JWT_EXPIRES_IN=7d"
    echo "  PORT=5000"
    echo "  NODE_ENV=production"
    echo "  FRONTEND_URL=http://localhost:3000"
    echo "  VITE_API_URL=http://localhost:5000"
    echo ""
    echo "자세한 내용은 DOCKER_SETUP.md를 참조하세요."
    exit 1
fi

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

echo "📦 Docker 이미지 빌드 및 컨테이너 시작 중..."
echo ""

# Docker Compose 실행
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 서버가 시작되었습니다!"
    echo ""
    echo "📍 접속 주소:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   Health Check: http://localhost:5000/health"
    echo ""
    echo "📋 유용한 명령어:"
    echo "   로그 확인: docker-compose logs -f"
    echo "   중지: docker-compose down"
    echo "   상태 확인: docker-compose ps"
    echo ""
else
    echo ""
    echo "❌ 서버 시작에 실패했습니다."
    echo "   로그를 확인하세요: docker-compose logs"
    exit 1
fi

