# 배포 단계별 가이드

최종 결정된 구성에 따른 배포 단계별 가이드입니다.

## 사전 준비

### 1. 계정 생성
- [ ] Supabase 계정 생성 및 프로젝트 생성
- [ ] Cloudflare 계정 생성
- [ ] Render 계정 생성
- [ ] Oracle Cloud 계정 생성 (Worker용)

### 2. GitHub 저장소 준비
- [ ] 코드가 GitHub에 푸시되어 있는지 확인
- [ ] 모든 변경사항 커밋 및 푸시

## Phase 1: Supabase 설정

### 1.1 Database 설정
1. Supabase Dashboard > Settings > Database
2. Connection string 복사 (DATABASE_URL, DIRECT_URL)
3. Database 비밀번호 확인

### 1.2 Storage Buckets 생성
1. Supabase Dashboard > Storage
2. "New bucket" 클릭
3. `uploads` bucket 생성:
   - Name: `uploads`
   - Public: `false` (private)
   - File size limit: 50MB
4. `derivatives` bucket 생성:
   - Name: `derivatives`
   - Public: `false` (private)
   - File size limit: 10MB

### 1.3 RLS 정책 적용
1. Supabase Dashboard > SQL Editor
2. `supabase/02_enable_rls.sql` 실행
3. `supabase/03_create_policies.sql` 실행
4. Storage Policies 설정 (Dashboard > Storage > Policies)

## Phase 2: Backend 배포 (Render)

### 2.1 Render 프로젝트 생성
1. Render Dashboard > New + > Web Service
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `problems-backend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:generate && npm start`

### 2.2 환경 변수 설정
Render Dashboard > Environment에서 다음 변수 추가:

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

### 2.3 배포 및 마이그레이션
1. "Create Web Service" 클릭하여 배포 시작
2. 배포 완료 후 Logs에서 확인
3. Render Shell에서 마이그레이션 실행:
   ```bash
   npm run prisma:migrate:deploy
   ```
4. Health check 확인: `https://your-backend.onrender.com/health`

## Phase 3: Frontend 배포 (Cloudflare Pages)

### 3.1 Cloudflare Pages 프로젝트 생성
1. Cloudflare Dashboard > Pages > Create a project
2. "Connect to Git" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Project name**: `problems-frontend`
   - **Production branch**: `main`
   - **Framework preset**: `None` 또는 `Vite`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`

### 3.2 환경 변수 설정
Cloudflare Pages > Settings > Environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON-KEY]
```

### 3.3 배포 확인
1. "Save and Deploy" 클릭
2. 배포 완료 후 URL 확인
3. Frontend 접속 테스트

## Phase 4: Worker 배포 (Oracle Cloud VM)

### 4.1 Oracle Cloud VM 생성
1. Oracle Cloud Dashboard > Compute > Instances
2. "Create Instance" 클릭
3. Free Tier 선택:
   - **Shape**: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
   - **Image**: Oracle Linux 또는 Ubuntu
   - **Region**: 가장 가까운 리전 선택
4. SSH 키 생성 및 다운로드
5. 인스턴스 생성

### 4.2 VM 설정
1. SSH로 VM 접속
2. Docker 설치:
   ```bash
   # Oracle Linux
   sudo yum install docker -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker opc
   
   # Ubuntu
   sudo apt-get update
   sudo apt-get install docker.io -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ubuntu
   ```
3. Docker Compose 설치 (선택사항)

### 4.3 Worker 배포
1. 프로젝트 클론:
   ```bash
   git clone https://github.com/your-username/problems.git
   cd problems/worker
   ```
2. `.env` 파일 생성:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
   STORAGE_TYPE=supabase
   POLL_INTERVAL_MS=5000
   MAX_CONCURRENT_JOBS=1
   ```
3. Prisma schema 복사:
   ```bash
   cp ../backend/prisma/schema.prisma ./prisma/
   ```
4. Docker 이미지 빌드:
   ```bash
   docker build -t problems-worker .
   ```
5. Docker 컨테이너 실행:
   ```bash
   docker run -d \
     --name problems-worker \
     --restart unless-stopped \
     --env-file .env \
     problems-worker
   ```

### 4.4 자동 시작 설정
1. systemd 서비스 파일 생성:
   ```bash
   sudo nano /etc/systemd/system/problems-worker.service
   ```
2. 서비스 파일 내용:
   ```ini
   [Unit]
   Description=Problems Worker Service
   After=docker.service
   Requires=docker.service

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/home/opc/problems/worker
   ExecStart=/usr/bin/docker start problems-worker
   ExecStop=/usr/bin/docker stop problems-worker
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
3. 서비스 활성화:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable problems-worker
   sudo systemctl start problems-worker
   ```

## Phase 5: 테스트 및 검증

### 5.1 기본 기능 테스트
- [ ] Frontend 접속 확인
- [ ] Backend Health Check (`/health`)
- [ ] 로그인/회원가입 테스트
- [ ] 파일 업로드 테스트
- [ ] Job 생성 및 처리 테스트
- [ ] Worker 로그 확인

### 5.2 모니터링 설정
- [ ] UptimeRobot 설정 (무료)
- [ ] Cloudflare Analytics 확인
- [ ] Worker 로그 모니터링

## 문제 해결

### Render 슬리프 모드
- 무료 플랜은 15분 비활성 시 슬리프 모드
- 첫 요청이 느릴 수 있음
- 해결: 유료 플랜($7/월)으로 업그레이드

### Supabase 제한
- 500MB DB 제한 모니터링
- 1GB Storage 제한 모니터링
- 해결: Pro 플랜($25/월)으로 업그레이드

### Worker 연결 문제
- DATABASE_URL 확인
- SUPABASE_SERVICE_ROLE_KEY 확인
- Docker 로그 확인: `docker logs problems-worker`

## 다음 단계

배포 완료 후:
1. 실제 파일 처리 로직 구현 (extract, OCR, classify)
2. AI/ML 통합 (필요 시)
3. 모니터링 및 알림 설정
4. 성능 최적화

