# 서버 실행 가이드

## ✅ 준비 완료된 항목

- ✅ 의존성 설치 완료 (backend, frontend)
- ✅ 환경 변수 파일 생성 완료
- ✅ SQLite 데이터베이스 설정 완료
- ✅ Prisma 마이그레이션 완료
- ✅ 데이터베이스 생성 완료

## 🚀 서버 실행

### 방법 1: 개별 실행 (권장)

**터미널 1 - Backend:**
```bash
cd backend
npm run dev
```

**터미널 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 방법 2: 스크립트 사용

```bash
./start.sh
```

## 📍 접속 주소

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🎯 첫 사용자 가이드

1. 웹사이트 접속: http://localhost:3000
2. 회원가입 진행
3. 관리자 권한 부여 (Prisma Studio 사용):

```bash
cd backend
npm run prisma:studio
```

브라우저에서 사용자를 찾아 `role` 필드를 `ADMIN`으로 변경

## ⚠️ 참고사항

- **파일 업로드**: 클라우드 스토리지 설정이 없어도 다른 기능은 정상 작동합니다
- **OAuth**: 구글/카카오 OAuth 설정이 없어도 이메일 로그인은 정상 작동합니다
- **타입 에러**: 개발 모드에서는 타입 에러가 있어도 실행됩니다

## 🔧 문제 해결

### 포트 충돌
- Backend 포트 변경: `backend/.env`에서 `PORT=5001` 등으로 변경
- Frontend 포트 변경: `frontend/vite.config.ts`에서 포트 변경

### 데이터베이스 초기화
```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate
```

