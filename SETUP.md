# 로컬 실행 가이드

## 사전 준비사항

1. **Node.js** (v18 이상)
2. **PostgreSQL** 데이터베이스
3. **npm** 또는 **yarn**

## 빠른 시작

### 1. 환경 변수 설정

**Backend** (`backend/.env` 파일 생성):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/problems_db
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env` 파일 생성):
```env
VITE_API_URL=http://localhost:5000
```

### 2. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE problems_db;
```

### 3. 데이터베이스 마이그레이션

```bash
cd backend
npm run prisma:migrate
```

마이그레이션 이름을 입력하라고 하면 `init` 또는 원하는 이름을 입력하세요.

### 4. 서버 실행

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

### 5. 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 첫 관리자 계정 생성

1. 웹사이트에서 회원가입
2. PostgreSQL에서 사용자 role을 ADMIN으로 변경:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

또는 Prisma Studio 사용:
```bash
cd backend
npm run prisma:studio
```

## 문제 해결

### Prisma 오류
- `prisma generate` 실행: `cd backend && npm run prisma:generate`
- 데이터베이스 연결 확인: `.env` 파일의 `DATABASE_URL` 확인

### 포트 충돌
- Backend 포트 변경: `backend/.env`에서 `PORT=5001` 등으로 변경
- Frontend 포트 변경: `frontend/vite.config.ts`에서 포트 변경

### 파일 업로드 오류
- 클라우드 스토리지 설정이 없어도 다른 기능은 정상 작동합니다
- PDF 업로드만 사용하려면 `.env`에 스토리지 설정 추가 필요

