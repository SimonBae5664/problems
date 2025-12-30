# 서비스 운영 체크리스트

Vercel과 Render 배포 후 서비스를 정상적으로 운영하기 위한 필수 체크리스트입니다.

## ✅ 현재 완료된 항목

- [x] 프론트엔드 배포 (Vercel)
- [x] 백엔드 배포 (Render)
- [x] 프론트엔드 환경 변수: `VITE_API_URL = https://problems-ajim.onrender.com`

## 🔴 필수 설정 (즉시 확인 필요)

### 1. 백엔드 환경 변수 확인 (Render)

Render 대시보드 → 백엔드 서비스 → Environment에서 다음 변수들이 모두 설정되어 있는지 확인:

#### 필수 변수

```env
# 데이터베이스
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# 인증
JWT_SECRET=[강력한-랜덤-문자열-32자-이상]  # ⚠️ 반드시 설정 필요!
NODE_ENV=production

# CORS 설정
FRONTEND_URL=https://frontend-phi-ivory-48.vercel.app
```

#### 선택적 변수 (기능 사용 시)

```env
# 이메일 인증 (회원가입 시 이메일 발송)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Gmail 앱 비밀번호

# 파일 스토리지 (Supabase 사용 시)
STORAGE_TYPE=supabase
STORAGE_BUCKET=uploads
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]

# 또는 S3/R2 사용 시
STORAGE_TYPE=s3  # 또는 r2, gcs
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=https://your-endpoint.com  # R2 사용 시
```

### 2. 데이터베이스 마이그레이션 확인

Render Shell 또는 로컬에서 마이그레이션 실행:

```bash
# Render Shell 접속 후
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
```

또는 Render 대시보드 → Shell에서:
```bash
npx prisma migrate deploy
```

### 3. CORS 설정 확인

백엔드 `FRONTEND_URL` 환경 변수가 올바른 Vercel URL로 설정되어 있는지 확인:
- ✅ `https://frontend-phi-ivory-48.vercel.app`

여러 도메인을 허용하려면 백엔드 코드 수정 필요 (선택사항)

### 4. Health Check 확인

브라우저에서 접속 테스트:
- 백엔드: `https://problems-ajim.onrender.com/health` 또는 `/api/health`
- 프론트엔드: `https://frontend-phi-ivory-48.vercel.app`

## 🟡 중요 설정 (기능별)

### 이메일 인증 기능 사용 시

1. **Gmail 앱 비밀번호 생성** (Gmail 사용 시)
   - Google 계정 → 보안 → 2단계 인증 활성화
   - 앱 비밀번호 생성
   - Render 환경 변수에 `EMAIL_PASSWORD` 설정

2. **다른 이메일 서비스 사용 시**
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` 설정
   - 해당 서비스의 SMTP 정보 입력

3. **테스트**
   - 회원가입 시 이메일이 발송되는지 확인
   - 이메일 인증 코드가 정상 작동하는지 확인

### 파일 업로드 기능 사용 시

1. **Supabase Storage 설정** (권장)
   - Supabase Dashboard → Storage
   - `uploads` 버킷 생성 (Private)
   - `derivatives` 버킷 생성 (Private)
   - 환경 변수 설정:
     ```
     STORAGE_TYPE=supabase
     STORAGE_BUCKET=uploads
     SUPABASE_URL=https://[PROJECT-REF].supabase.co
     SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
     ```

2. **S3/R2 사용 시**
   - 버킷 생성 및 권한 설정
   - Access Key 생성
   - 환경 변수 설정

3. **테스트**
   - 파일 업로드 기능 테스트
   - 파일 다운로드 기능 테스트

### Worker 서비스 사용 시 (백그라운드 작업)

Worker가 필요한 경우 (파일 처리, OCR 등):
- Oracle Cloud VM 또는 다른 서버에 Worker 배포
- Worker 환경 변수 설정
- Worker와 백엔드 연결 확인

## 🟢 테스트 체크리스트

### 기본 기능 테스트

- [ ] 프론트엔드 접속 확인
- [ ] 백엔드 Health Check 확인
- [ ] 회원가입 기능 테스트
- [ ] 로그인 기능 테스트
- [ ] 로그아웃 기능 테스트
- [ ] 토큰 갱신 테스트

### 고급 기능 테스트

- [ ] 이메일 인증 테스트 (이메일 설정 시)
- [ ] 파일 업로드 테스트 (스토리지 설정 시)
- [ ] 문제 업로드/조회 테스트
- [ ] 댓글 작성/조회 테스트
- [ ] 관리자 기능 테스트 (관리자 계정 생성 후)

### 에러 처리 확인

- [ ] 잘못된 로그인 정보 입력 시 에러 메시지 확인
- [ ] 만료된 토큰 사용 시 에러 처리 확인
- [ ] 네트워크 오류 시 에러 처리 확인

## 🔵 보안 확인

- [ ] `JWT_SECRET`이 강력한 랜덤 문자열인지 확인 (32자 이상)
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] HTTPS가 모든 도메인에서 활성화되어 있는지 확인
- [ ] CORS 설정이 올바른 도메인으로 제한되어 있는지 확인
- [ ] 환경 변수가 배포 플랫폼에 안전하게 저장되어 있는지 확인

## 🟣 모니터링 설정 (선택사항)

### 무료 모니터링 도구

1. **UptimeRobot** (무료)
   - https://uptimerobot.com
   - 백엔드/프론트엔드 URL 모니터링
   - 5분마다 체크, 다운타임 알림

2. **Vercel Analytics** (무료 플랜 포함)
   - Vercel 대시보드에서 자동 제공
   - 트래픽, 성능 모니터링

3. **Render Logs**
   - Render 대시보드 → Logs
   - 실시간 로그 확인

### 에러 로깅 (선택사항)

- **Sentry** (무료 플랜 있음)
- **LogRocket** (무료 플랜 있음)

## 📋 빠른 점검 명령어

### 백엔드 상태 확인

```bash
# Health Check
curl https://problems-ajim.onrender.com/health

# 또는 브라우저에서 접속
```

### 프론트엔드 상태 확인

```bash
# 브라우저에서 접속
https://frontend-phi-ivory-48.vercel.app
```

### 환경 변수 확인 (Render)

Render 대시보드 → Environment에서 확인

### 로그 확인

- **Render**: Dashboard → Logs
- **Vercel**: Dashboard → Deployments → 최신 배포 → View Function Logs

## 🚨 문제 해결

### 백엔드가 응답하지 않는 경우

1. Render 대시보드 → Logs 확인
2. 환경 변수 확인 (특히 `DATABASE_URL`, `JWT_SECRET`)
3. 마이그레이션 실행 확인
4. Render 무료 플랜 슬리프 모드 확인 (15분 비활성 시 슬리프)

### CORS 오류 발생 시

1. 백엔드 `FRONTEND_URL` 환경 변수 확인
2. Vercel URL이 정확히 입력되어 있는지 확인
3. 백엔드 재시작

### 데이터베이스 연결 오류

1. `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 데이터베이스 비밀번호 확인

### 이메일 발송 실패

1. `EMAIL_USER`, `EMAIL_PASSWORD` 확인
2. Gmail 앱 비밀번호 사용 확인
3. 이메일 서비스 로그 확인

## 📝 다음 단계

운영 체크리스트 완료 후:

1. **사용자 가이드 작성** (필요 시)
2. **API 문서화** (필요 시)
3. **백업 전략 수립**
4. **성능 최적화**
5. **확장성 고려** (트래픽 증가 시)

## 🔗 유용한 링크

- **Vercel 대시보드**: https://vercel.com/dashboard
- **Render 대시보드**: https://dashboard.render.com
- **Supabase 대시보드**: https://app.supabase.com
- **프론트엔드 URL**: https://frontend-phi-ivory-48.vercel.app
- **백엔드 URL**: https://problems-ajim.onrender.com

