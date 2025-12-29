# 수능 문제 공유 커뮤니티 웹 서비스

수능 문제를 공유하고 토론할 수 있는 커뮤니티 플랫폼입니다.

## 기술 스택

- **Frontend**: React + TypeScript, Vite, React Router
- **Backend**: Express.js + TypeScript, Node.js
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Authentication**: JWT, Passport.js (OAuth 지원)
- **File Storage**: 클라우드 오브젝트 스토리지 (AWS S3, Cloudflare R2, Supabase Storage 등)

## 프로젝트 구조

```
problems/
├── frontend/          # React 애플리케이션
├── backend/           # Express.js API 서버
├── prisma/            # 데이터베이스 스키마
└── README.md
```

## 시작하기

### 1. Supabase 설정

먼저 Supabase 프로젝트를 생성하고 연결 정보를 가져오세요. 자세한 내용은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

### 2. Backend 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일에서 DATABASE_URL을 Supabase 연결 문자열로 수정
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 3. Frontend 설정

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 환경 변수

### Backend (.env)

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 다음 값들을 설정하세요:

- `DATABASE_URL`: Supabase 연결 문자열 (필수)
- `JWT_SECRET`: JWT 토큰 암호화 키 (필수)
- `STORAGE_*`: 파일 스토리지 설정 (선택사항)
- `OAUTH_*`: OAuth 설정 (선택사항)

자세한 내용은 `backend/.env.example` 파일을 참조하세요.

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
```

## 배포

### Supabase

데이터베이스는 Supabase에서 자동으로 관리됩니다.

### Vercel / Netlify (Frontend)

Frontend는 Vercel이나 Netlify에 배포할 수 있습니다.

### Railway / Render (Backend)

Backend는 Railway나 Render에 배포할 수 있습니다.

