# Worker Service

비동기 파일 처리 워커 서비스입니다. 파일 업로드 후 텍스트 추출, OCR, 분류 등의 작업을 처리합니다.

## 기능

- DB 폴링 방식으로 작업 큐 처리
- `SELECT ... FOR UPDATE SKIP LOCKED`를 사용한 동시성 안전 보장
- 여러 워커 인스턴스로 확장 가능
- Supabase Storage 통합

## 설정

1. 환경 변수 설정 (`.env` 파일 생성):

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
STORAGE_TYPE=supabase
POLL_INTERVAL_MS=5000
MAX_CONCURRENT_JOBS=1
```

2. Prisma Client 생성:

```bash
cd worker
npx prisma generate
```

3. 빌드:

```bash
npm run build
```

## 실행

### 로컬 개발

```bash
npm run dev
```

### 프로덕션

```bash
npm start
```

### Docker

```bash
docker build -t problems-worker .
docker run --env-file .env problems-worker
```

## Oracle Cloud Free Tier VM 배포

1. VM 인스턴스 생성 (1 OCPU, 1GB RAM)
2. Docker 설치
3. 프로젝트 클론 및 설정
4. Docker 컨테이너 실행:

```bash
docker run -d \
  --name problems-worker \
  --restart unless-stopped \
  --env-file .env \
  problems-worker
```

## 작업 처리 흐름

1. Backend API가 `ProcessingJob` 레코드를 `status='QUEUED'`로 생성
2. Worker가 DB를 폴링하여 대기 중인 작업 발견
3. `SELECT ... FOR UPDATE SKIP LOCKED`로 작업 가져오기
4. `status='PROCESSING'`으로 변경
5. Supabase Storage에서 원본 파일 다운로드
6. 작업 타입별 처리 함수 실행
7. 결과를 `derivatives` bucket에 업로드
8. `JobOutput` 레코드 생성
9. `status='SUCCEEDED'` 또는 `'FAILED'`로 변경

## 확장

여러 워커 인스턴스를 실행하면 각각 독립적으로 작업을 가져가 처리합니다. DB 잠금 메커니즘으로 동시성 문제를 방지합니다.

