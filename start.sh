#!/bin/bash

echo "🚀 수능 문제 공유 커뮤니티 서비스 시작"
echo ""

# Backend 시작
echo "📦 Backend 서버 시작 중..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 잠시 대기
sleep 3

# Frontend 시작
echo "🎨 Frontend 서버 시작 중..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 서버가 시작되었습니다!"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5000"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"

# 종료 시 프로세스 정리
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
