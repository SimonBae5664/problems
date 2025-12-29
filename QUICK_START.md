# 빠른 시작 가이드

## 옵션 1: SQLite 사용 (가장 빠름, 개발용)

PostgreSQL 설치 없이 바로 시작할 수 있습니다.

### 1. SQLite 스키마로 변경

```bash
cd backend
cp prisma/schema.sqlite.prisma prisma/schema.prisma
```

### 2. .env 파일 수정

`backend/.env` 파일에서:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Prisma 마이그레이션

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `init` 입력

### 4. 서버 실행

```bash
# 터미널 1
cd backend && npm run dev

# 터미널 2
cd frontend && npm run dev
```

---

## 옵션 2: PostgreSQL 사용 (프로덕션 권장)

### PostgreSQL 설치 (macOS)

```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PostgreSQL 설치
brew install postgresql@15

# PostgreSQL 시작
brew services start postgresql@15
```

### 데이터베이스 생성

```bash
# PostgreSQL 접속
psql postgres

# 데이터베이스 생성
CREATE DATABASE problems_db;
CREATE USER problems_user WITH PASSWORD 'problems_password';
GRANT ALL PRIVILEGES ON DATABASE problems_db TO problems_user;
\q
```

### .env 파일 수정

`backend/.env` 파일에서:
```env
DATABASE_URL=postgresql://problems_user:problems_password@localhost:5432/problems_db
```

### Prisma 마이그레이션

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

---

## 서버 실행

두 옵션 모두 마이그레이션 후:

```bash
# 터미널 1 - Backend
cd backend
npm run dev

# 터미널 2 - Frontend  
cd frontend
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

