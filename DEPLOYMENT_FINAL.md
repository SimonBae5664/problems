# 최종 배포 가이드

하이브리드 서버 배포 계획에 따라 최종 결정된 구성으로 배포하는 가이드입니다.

## 최종 결정된 구성

### 배포 플랫폼
- **Frontend**: Cloudflare Pages (무료)
- **Backend API**: Render (무료 플랜 또는 $7/월)
- **Worker**: Oracle Cloud Free Tier VM (무료)
- **Database**: Supabase 무료 플랜 (500MB)
- **Storage**: Supabase Storage 무료 플랜 (1GB)

### 월 예상 비용
- **최소**: $0/월 (모든 무료 플랜)
- **권장**: $7/월 (Render 유료 플랜)

## 배포 순서

### 1. Supabase 설정

1. Supabase 프로젝트 생성
2. Database 연결 정보 확인
3. Storage buckets 생성:
   - `uploads` (private)
   - `derivatives` (private)
4. RLS 정책 적용 (`supabase/` 폴더의 SQL 스크립트 실행)

### 2. Backend API 배포 (Render)

1. Render 계정 생성 및 GitHub 연동
2. New Web Service 생성
3. 설정:
   - **Name**: `problems-backend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:generate && npm start`
4. 환경 변수 설정 (아래 참조)
5. 배포 및 URL 확인

### 3. Frontend 배포 (Cloudflare Pages)

1. Cloudflare 계정 생성
2. Pages > Create a project
3. GitHub 저장소 연결
4. 설정:
   - **Project name**: `problems-frontend`
   - **Production branch**: `main`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
5. 환경 변수 설정:
   - `VITE_API_URL`: Render Backend URL
6. 배포 및 URL 확인

### 4. Worker 배포 (Oracle Cloud VM)

1. Oracle Cloud 계정 생성
2. Free Tier VM 인스턴스 생성 (1 OCPU, 1GB RAM)
3. VM에 접속하여 Docker 설치
4. 프로젝트 클론 또는 파일 전송
5. `.env` 파일 설정
6. Docker 이미지 빌드 및 실행
7. systemd 서비스 설정 (자동 시작)

## 환경 변수 설정

### Backend (Render)

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=[강력한-랜덤-문자열-32자-이상]
NODE_ENV=production
FRONTEND_URL=https://your-frontend.pages.dev
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
STORAGE_TYPE=supabase
```

### Frontend (Cloudflare Pages)

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON-KEY]
```

### Worker (Oracle Cloud VM)

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
STORAGE_TYPE=supabase
POLL_INTERVAL_MS=5000
MAX_CONCURRENT_JOBS=1
```

## 배포 후 확인사항

- [ ] Frontend 접속 확인
- [ ] Backend Health Check (`/health`) 확인
- [ ] Supabase Database 연결 확인
- [ ] Supabase Storage buckets 확인
- [ ] Worker 실행 확인 (로그 확인)
- [ ] 파일 업로드 테스트
- [ ] Job 생성 및 처리 테스트

## 문제 해결

### Render 슬리프 모드
- 무료 플랜은 15분 비활성 시 슬리프 모드
- 첫 요청이 느릴 수 있음
- 해결: 유료 플랜($7/월)으로 업그레이드

### Supabase 제한
- 500MB DB 제한: 데이터 모니터링 필요
- 1GB Storage 제한: 파일 관리 필요
- 해결: Pro 플랜($25/월)으로 업그레이드

### Oracle Cloud VM
- Free Tier 리소스 제한
- VM 재시작 시 자동 시작 설정 확인
- 로그 모니터링 설정

## 참고 문서

- `IMPLEMENTATION_SUMMARY.md`: 구현 완료 사항
- `supabase/README.md`: Supabase 설정 가이드
- `worker/README.md`: Worker 서비스 가이드

