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

### 방법 1: Docker로 실행 (권장)

Docker가 설치되어 있다면 가장 간단한 방법입니다:

1. **환경 변수 설정**
   - 프로젝트 루트에 `.env` 파일 생성
   - [DOCKER_SETUP.md](./DOCKER_SETUP.md) 참조하여 필수 변수 설정

2. **실행**
   ```bash
   ./docker-start.sh
   # 또는
   docker-compose up -d --build
   ```

3. **접속**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

자세한 내용은 [DOCKER_SETUP.md](./DOCKER_SETUP.md)를 참조하세요.

### 방법 2: 로컬에서 직접 실행

#### 1. Supabase 설정

먼저 Supabase 프로젝트를 생성하고 연결 정보를 가져오세요. 자세한 내용은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참조하세요.

#### 2. Backend 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일에서 DATABASE_URL을 Supabase 연결 문자열로 수정
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

#### 3. Frontend 설정

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

자세한 내용은 [SETUP.md](./SETUP.md)를 참조하세요.

## 환경 변수

### Backend (.env)

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 다음 값들을 설정하세요:

- `DATABASE_URL`: Supabase 연결 문자열 (필수)
- `JWT_SECRET`: JWT 토큰 암호화 키 (필수)
- `STORAGE_*`: 파일 스토리지 설정 (선택사항)
- `OAUTH_*`: OAuth 설정 (선택사항)

자세한 내용은 `backend/.env.example` 파일을 참조하세요.

**OAuth 설정**: Google 및 Kakao OAuth 로그인을 사용하려면 [OAUTH_SETUP.md](./OAUTH_SETUP.md)를 참조하세요.

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
```

## 배포

프로덕션 환경에 배포하는 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 빠른 배포 옵션

- **Frontend**: [Vercel](https://vercel.com) (무료, 자동 HTTPS)
- **Backend**: [Railway](https://railway.app) 또는 [Render](https://render.com) (무료 플랜 제공)
- **Database**: Supabase (이미 사용 중)

### Docker 배포

Docker를 사용한 배포도 지원합니다. 자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

