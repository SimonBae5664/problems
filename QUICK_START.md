# 빠른 시작 가이드

이 프로젝트는 **Supabase (PostgreSQL)**를 데이터베이스로 사용합니다.

## 시작하기

### 1. Supabase 프로젝트 설정

먼저 Supabase 프로젝트를 생성하고 연결 정보를 가져오세요. 자세한 내용은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

### 2. 환경 변수 설정

**Backend** (`backend/.env` 파일 생성):
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
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

### 3. Prisma 마이그레이션

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `init` 입력

### 4. 서버 실행

```bash
# 터미널 1 - Backend
cd backend
npm run dev

# 터미널 2 - Frontend  
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 첫 관리자 계정 생성

1. 웹사이트에서 회원가입
2. Prisma Studio로 role 변경:

```bash
cd backend
npm run prisma:studio
```

브라우저에서 사용자를 찾아 `role`을 `ADMIN`으로 변경

또는 Supabase 대시보드에서 직접 SQL 실행:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 문제 해결

### Prisma 오류
- `prisma generate` 실행: `cd backend && npm run prisma:generate`
- 데이터베이스 연결 확인: `.env` 파일의 `DATABASE_URL` 확인
- Supabase 프로젝트가 활성화되어 있는지 확인 (무료 플랜은 일정 시간 후 일시 중지될 수 있음)

### 포트 충돌
- Backend 포트 변경: `backend/.env`에서 `PORT=5001` 등으로 변경
- Frontend 포트 변경: `frontend/vite.config.ts`에서 포트 변경

### 파일 업로드 오류
- 클라우드 스토리지 설정이 없어도 다른 기능은 정상 작동합니다
- PDF 업로드만 사용하려면 `.env`에 스토리지 설정 추가 필요
