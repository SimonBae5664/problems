# Docker로 실행하기

Docker와 Docker Compose를 사용하여 전체 애플리케이션을 실행하는 방법입니다.

## 사전 준비

1. **Docker** 및 **Docker Compose** 설치 확인
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Supabase 프로젝트** 설정 완료
   - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참조

## 빠른 시작

### 1. 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성하세요:

```bash
# 프로젝트 루트에서
touch .env
```

`.env` 파일 내용 (최소 필수 설정):

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (Docker 내부에서는 localhost:3000)
FRONTEND_URL=http://localhost:3000

# Frontend API URL (Backend URL)
VITE_API_URL=http://localhost:5000
```

**중요**: 
- `DATABASE_URL`을 Supabase 연결 문자열로 변경하세요
- `JWT_SECRET`을 강력한 랜덤 문자열로 변경하세요 (최소 32자)

### 2. 데이터베이스 마이그레이션 (최초 1회)

Docker를 사용하지 않고 로컬에서 마이그레이션을 실행하거나, Docker 컨테이너 내에서 실행할 수 있습니다:

**방법 1: 로컬에서 실행 (권장)**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate deploy
```

**방법 2: Docker 컨테이너에서 실행**
```bash
# Backend 컨테이너 빌드 및 실행
docker-compose up -d backend

# 마이그레이션 실행
docker-compose exec backend npm run prisma:migrate deploy

# 컨테이너 중지
docker-compose down
```

### 3. Docker Compose로 실행

```bash
# 프로젝트 루트에서
docker-compose up -d --build
```

이 명령어는:
- Backend와 Frontend 이미지를 빌드합니다
- 컨테이너를 백그라운드에서 실행합니다

### 4. 접속 확인

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 유용한 명령어

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# Backend만
docker-compose logs -f backend

# Frontend만
docker-compose logs -f frontend
```

### 컨테이너 상태 확인
```bash
docker-compose ps
```

### 컨테이너 중지
```bash
docker-compose down
```

### 컨테이너 중지 및 볼륨 삭제
```bash
docker-compose down -v
```

### 재시작
```bash
docker-compose restart
```

### 특정 서비스만 재빌드
```bash
docker-compose up -d --build backend
```

### 컨테이너 내부 접속
```bash
# Backend 컨테이너
docker-compose exec backend sh

# Frontend 컨테이너
docker-compose exec frontend sh
```

## 문제 해결

### 포트가 이미 사용 중입니다

다른 애플리케이션이 3000 또는 5000 포트를 사용 중일 수 있습니다.

**해결 방법 1**: 포트 변경
`docker-compose.yml` 파일에서 포트 매핑을 변경:
```yaml
ports:
  - "3001:80"  # Frontend
  - "5001:5000"  # Backend
```

그리고 `.env` 파일도 업데이트:
```env
FRONTEND_URL=http://localhost:3001
VITE_API_URL=http://localhost:5001
```

**해결 방법 2**: 기존 프로세스 종료
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :5000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
kill -9 <PID>
```

### 데이터베이스 연결 오류

1. `.env` 파일의 `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 확인

### 빌드 오류

```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 특정 서비스만 재빌드
docker-compose build --no-cache backend
```

### Prisma 관련 오류

Backend 컨테이너 내에서 Prisma를 다시 생성:
```bash
docker-compose exec backend npm run prisma:generate
docker-compose exec backend npm run prisma:migrate deploy
```

### 이미지/컨테이너 정리

```bash
# 사용하지 않는 이미지 삭제
docker image prune -a

# 사용하지 않는 컨테이너 삭제
docker container prune

# 모든 중지된 컨테이너, 네트워크, 이미지 삭제
docker system prune -a
```

## 프로덕션 배포

Docker를 사용한 프로덕션 배포는 [DEPLOYMENT.md](./DEPLOYMENT.md)의 "Docker를 사용한 배포" 섹션을 참조하세요.

## 개발 모드 vs 프로덕션 모드

현재 `docker-compose.yml`은 프로덕션 모드로 설정되어 있습니다. 개발 모드를 원한다면:

1. `docker-compose.dev.yml` 파일 생성 (선택사항)
2. 또는 로컬에서 직접 실행: [SETUP.md](./SETUP.md) 참조

## 추가 설정

### 환경 변수 추가

`.env` 파일에 필요한 환경 변수를 추가하면 `docker-compose.yml`의 `environment` 섹션을 통해 자동으로 전달됩니다.

### 볼륨 마운트 (개발 시)

개발 중 코드 변경사항을 즉시 반영하려면 `docker-compose.yml`에 볼륨을 추가할 수 있습니다:

```yaml
services:
  backend:
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
```

단, 프로덕션에서는 권장하지 않습니다.

