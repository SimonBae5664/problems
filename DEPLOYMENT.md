# 배포 가이드 (Deployment Guide)

이 문서는 수능 문제 공유 커뮤니티를 프로덕션 환경에 배포하는 방법을 안내합니다.

## 목차

1. [배포 옵션 개요](#배포-옵션-개요)
2. [환경 변수 설정](#환경-변수-설정)
3. [Vercel로 Frontend 배포](#vercel로-frontend-배포)
4. [Railway로 Backend 배포](#railway로-backend-배포)
5. [Render로 Backend 배포](#render로-backend-배포)
6. [Docker를 사용한 배포](#docker를-사용한-배포)
7. [배포 후 확인사항](#배포-후-확인사항)

## 배포 옵션 개요

### 추천 배포 구성

- **Frontend**: Vercel (무료, 자동 HTTPS, CDN)
- **Backend**: Railway 또는 Render (무료 플랜 제공)
- **Database**: Supabase (이미 사용 중)

### 대안 배포 구성

- **전체 스택**: Docker + VPS (AWS EC2, DigitalOcean, Linode 등)
- **Frontend**: Netlify, Cloudflare Pages
- **Backend**: Fly.io, Heroku (유료)

## 환경 변수 설정

### Backend 환경 변수

배포 플랫폼에서 다음 환경 변수를 설정해야 합니다:

```env
# 필수 변수
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=강력한-랜덤-문자열-최소-32자
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app

# 선택적 변수 (OAuth 사용 시)
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_CALLBACK_URL=https://your-backend-domain.railway.app/api/auth/google/callback
OAUTH_KAKAO_CLIENT_ID=your-kakao-rest-api-key
OAUTH_KAKAO_CALLBACK_URL=https://your-backend-domain.railway.app/api/auth/kakao/callback

# 선택적 변수 (파일 스토리지 사용 시)
STORAGE_TYPE=s3
STORAGE_S3_BUCKET=your-bucket-name
STORAGE_S3_REGION=ap-northeast-2
STORAGE_S3_ACCESS_KEY=your-access-key
STORAGE_S3_SECRET_KEY=your-secret-key

# 선택적 변수 (이메일 인증 사용 시)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**중요**: `JWT_SECRET`은 반드시 강력한 랜덤 문자열로 설정하세요. 다음 명령어로 생성할 수 있습니다:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend 환경 변수

```env
VITE_API_URL=https://your-backend-domain.railway.app
```

## Vercel로 Frontend 배포

### 1. Vercel 계정 생성

1. [Vercel](https://vercel.com)에 가입
2. GitHub 계정으로 연동 (권장)

### 2. 프로젝트 배포

1. Vercel 대시보드에서 "Add New Project" 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Root Directory**: `frontend` 선택
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. 환경 변수 추가:
   - `VITE_API_URL`: Backend URL (예: `https://your-backend.railway.app`)

5. "Deploy" 클릭

### 3. 커스텀 도메인 설정 (선택사항)

1. Vercel 프로젝트 설정 > Domains
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 도메인 DNS 레코드 추가

### 4. 자동 배포 설정

GitHub에 push하면 자동으로 배포됩니다. `vercel.json` 파일이 이미 설정되어 있습니다.

## Railway로 Backend 배포

### 1. Railway 계정 생성

1. [Railway](https://railway.app)에 가입
2. GitHub 계정으로 연동

### 2. 프로젝트 배포

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 저장소 선택 후 "Deploy Now" 클릭

### 3. 프로젝트 설정

1. **Root Directory**: `backend`로 설정
2. **Build Command**: 자동 감지됨 (또는 `npm install && npm run prisma:generate && npm run build`)
3. **Start Command**: `npm run prisma:generate && npm start`

### 4. 환경 변수 설정

Railway 대시보드 > Variables 탭에서 모든 환경 변수 추가:

```
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=...
등등...
```

### 5. 도메인 설정

1. Settings > Networking
2. "Generate Domain" 클릭하여 무료 도메인 생성
3. 또는 "Custom Domain"에서 커스텀 도메인 추가

### 6. 데이터베이스 마이그레이션

배포 후 Railway 터미널에서:

```bash
npm run prisma:migrate deploy
```

또는 Railway 대시보드에서 "Deploy Logs" 확인하여 자동 실행 여부 확인

## Render로 Backend 배포

### 1. Render 계정 생성

1. [Render](https://render.com)에 가입
2. GitHub 계정으로 연동

### 2. Web Service 생성

1. Dashboard > "New +" > "Web Service"
2. GitHub 저장소 선택
3. 설정:
   - **Name**: `problems-backend`
   - **Region**: `Singapore` (한국과 가까움)
   - **Branch**: `main` 또는 `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:generate && npm start`

### 3. 환경 변수 설정

Environment 탭에서 모든 환경 변수 추가

### 4. 도메인 설정

Settings > Custom Domain에서 도메인 추가

## Docker를 사용한 배포

### 로컬에서 Docker 실행

```bash
# .env 파일 생성 (프로젝트 루트)
cp backend/.env.example .env
# .env 파일 편집

# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### VPS에 배포

#### 1. 서버 준비

```bash
# Docker 및 Docker Compose 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 프로젝트 배포

```bash
# 프로젝트 클론
git clone https://github.com/your-username/problems.git
cd problems

# .env 파일 생성 및 설정
nano .env

# Docker Compose로 실행
docker-compose up -d --build

# 자동 재시작 설정 (서버 재부팅 시)
sudo systemctl enable docker
```

#### 3. Nginx 리버스 프록시 설정 (선택사항)

```nginx
# /etc/nginx/sites-available/problems
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 4. SSL 인증서 설정 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 배포 후 확인사항

### 1. Health Check

- Frontend: `https://your-frontend-domain.com/health`
- Backend: `https://your-backend-domain.com/health`

### 2. API 연결 확인

브라우저 개발자 도구 > Network 탭에서 API 요청이 정상적으로 작동하는지 확인

### 3. 데이터베이스 연결 확인

Backend 로그에서 데이터베이스 연결 오류가 없는지 확인

### 4. CORS 설정 확인

Backend의 `FRONTEND_URL`이 Frontend 도메인과 일치하는지 확인

### 5. OAuth 리다이렉트 URI 업데이트

Google 및 Kakao OAuth 설정에서 리다이렉트 URI를 프로덕션 URL로 업데이트:

- Google: `https://your-backend-domain.com/api/auth/google/callback`
- Kakao: `https://your-backend-domain.com/api/auth/kakao/callback`

### 6. 파일 업로드 테스트

파일 업로드 기능이 정상 작동하는지 확인

### 7. 이메일 인증 테스트 (사용 시)

이메일 인증 기능이 정상 작동하는지 확인

## 트러블슈팅

### Backend가 시작되지 않음

1. 환경 변수 확인 (특히 `DATABASE_URL`, `JWT_SECRET`)
2. Prisma 마이그레이션 실행 여부 확인
3. 로그 확인: `railway logs` 또는 Render 대시보드

### Frontend에서 API 호출 실패

1. `VITE_API_URL` 환경 변수 확인
2. Backend CORS 설정 확인 (`FRONTEND_URL`)
3. 브라우저 콘솔에서 CORS 오류 확인

### 데이터베이스 연결 오류

1. Supabase 프로젝트가 활성화되어 있는지 확인
2. `DATABASE_URL` 형식 확인
3. Supabase 대시보드에서 연결 정보 재확인

### OAuth 로그인 실패

1. OAuth 리다이렉트 URI가 프로덕션 URL과 일치하는지 확인
2. OAuth 앱 설정에서 도메인 허용 목록 확인

## 비용 예상

### 무료 플랜으로 시작 가능

- **Vercel**: 무료 (월 100GB 대역폭)
- **Railway**: 무료 크레딧 $5/월 (제한적)
- **Render**: 무료 플랜 (제한적, 15분 비활성 시 슬리프 모드)
- **Supabase**: 무료 플랜 (500MB 데이터베이스)

### 프로덕션 권장 플랜

- **Vercel Pro**: $20/월
- **Railway Pro**: $20/월
- **Render**: $7/월 (Web Service)
- **Supabase Pro**: $25/월

## 보안 체크리스트

- [ ] `JWT_SECRET`을 강력한 랜덤 문자열로 설정
- [ ] 모든 환경 변수가 배포 플랫폼에 안전하게 저장됨
- [ ] `.env` 파일이 Git에 커밋되지 않음
- [ ] HTTPS가 모든 도메인에서 활성화됨
- [ ] CORS가 올바른 도메인으로 제한됨
- [ ] 데이터베이스 연결 문자열에 비밀번호가 포함되어 있음
- [ ] OAuth 리다이렉트 URI가 프로덕션 URL로 업데이트됨

## 추가 리소스

- [Vercel 문서](https://vercel.com/docs)
- [Railway 문서](https://docs.railway.app)
- [Render 문서](https://render.com/docs)
- [Docker 문서](https://docs.docker.com)
- [Supabase 문서](https://supabase.com/docs)

