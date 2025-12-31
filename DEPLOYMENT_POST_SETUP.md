# 배포 후 필수 설정 가이드

Vercel과 Render 배포가 완료된 후, 서비스가 정상 작동하도록 확인해야 할 사항들입니다.

## 🎯 현재 상태

- ✅ 프론트엔드 배포 완료 (Vercel)
- ✅ 백엔드 배포 완료 (Render)
- ✅ 서비스 Live 상태 확인

## 🔴 1단계: 환경 변수 확인 (필수!)

### Render (백엔드) 환경 변수 확인

Render 대시보드 → 백엔드 서비스 → **Environment** 탭에서 다음 변수들이 모두 설정되어 있는지 확인:

#### 필수 변수 (반드시 필요)

```env
# 데이터베이스 연결
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT 인증
JWT_SECRET=[강력한-랜덤-문자열-최소-32자]  # ⚠️ 반드시 설정!
JWT_EXPIRES_IN=7d

# 서버 설정
NODE_ENV=production
PORT=10000  # Render가 자동 설정하지만 확인

# CORS 설정 (프론트엔드 URL)
FRONTEND_URL=https://[YOUR-VERCEL-APP].vercel.app
```

**확인 방법:**
1. Render 대시보드 → 백엔드 서비스 클릭
2. 왼쪽 메뉴 → **Environment** 클릭
3. 위 변수들이 모두 있는지 확인
4. 없으면 **"Add Environment Variable"** 클릭하여 추가

### Vercel (프론트엔드) 환경 변수 확인

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서:

```env
VITE_API_URL=https://problems-backend-s622.onrender.com
```

**확인 방법:**
1. Vercel 대시보드 → 프로젝트 클릭
2. **Settings** → **Environment Variables**
3. `VITE_API_URL`이 올바른 백엔드 URL로 설정되어 있는지 확인
4. **Production**, **Preview**, **Development** 모두에 설정되어 있는지 확인

---

## 🟡 2단계: 데이터베이스 마이그레이션 (필수!)

데이터베이스 테이블이 생성되어 있지 않으면 서비스가 작동하지 않습니다.

### 방법 1: Render Shell 사용 (권장)

1. Render 대시보드 → 백엔드 서비스 클릭
2. 왼쪽 메뉴 → **Shell** 클릭
3. 다음 명령어 실행:

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

### 방법 2: 로컬에서 실행

로컬에서 Supabase 데이터베이스에 직접 연결하여 마이그레이션:

```bash
cd backend

# .env 파일에 DATABASE_URL 설정 (Supabase 연결 문자열)
# 그 다음:
npm run prisma:generate
npx prisma migrate deploy
```

**확인:**
- 마이그레이션 성공 메시지 확인
- Supabase Dashboard → Table Editor에서 테이블들이 생성되었는지 확인

---

## 🟢 3단계: Health Check 확인

서비스가 정상 작동하는지 확인합니다.

### 백엔드 Health Check

브라우저에서 접속:
```
https://problems-backend-s622.onrender.com/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 프론트엔드 확인

브라우저에서 접속:
```
https://[YOUR-VERCEL-APP].vercel.app
```

프론트엔드가 정상적으로 로드되는지 확인

---

## 🔵 4단계: CORS 설정 확인

프론트엔드에서 백엔드 API를 호출할 수 있는지 확인합니다.

### 확인 방법

1. 브라우저 개발자 도구 열기 (F12)
2. **Console** 탭 확인
3. 프론트엔드에서 API 호출 시 CORS 오류가 없는지 확인

### CORS 오류가 발생하는 경우

Render 환경 변수에서 `FRONTEND_URL`이 정확한 Vercel URL로 설정되어 있는지 확인:
- ✅ 올바른 형식: `https://your-app.vercel.app`
- ❌ 잘못된 형식: `http://your-app.vercel.app` (http가 아님)
- ❌ 잘못된 형식: `https://your-app.vercel.app/` (끝에 슬래시)

---

## 🟣 5단계: 기본 기능 테스트

### 테스트 체크리스트

- [ ] **회원가입 테스트**
  - 프론트엔드에서 회원가입 시도
  - 성공적으로 가입되는지 확인

- [ ] **로그인 테스트**
  - 가입한 계정으로 로그인
  - 토큰이 정상적으로 발급되는지 확인

- [ ] **API 호출 테스트**
  - 브라우저 개발자 도구 → Network 탭
  - API 요청이 성공하는지 확인 (200 OK)

- [ ] **에러 처리 확인**
  - 잘못된 로그인 정보 입력 시 적절한 에러 메시지 표시 확인

---

## 🟠 6단계: 선택적 기능 설정

### 이메일 인증 기능 사용 시

**Gmail 사용하는 경우:**

1. **Gmail 앱 비밀번호 생성**
   - Google 계정 → 보안 → 2단계 인증 활성화
   - 앱 비밀번호 생성 (16자리)
   - Render 환경 변수에 추가:
     ```env
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_SECURE=false
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=[앱-비밀번호]
     ```

2. **테스트**
   - 회원가입 시 이메일이 발송되는지 확인
   - 이메일 인증 코드가 작동하는지 확인

### 파일 업로드 기능 사용 시

**Supabase Storage 설정:**

1. **Supabase Dashboard → Storage**
2. **버킷 생성:**
   - `uploads` 버킷 생성 (Private)
   - `derivatives` 버킷 생성 (Private)
3. **Render 환경 변수 추가:**
   ```env
   STORAGE_TYPE=supabase
   STORAGE_BUCKET=uploads
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
   ```
4. **Service Role Key 찾기:**
   - Supabase Dashboard → Settings → API
   - Service Role Key 복사 (주의: 비밀번호처럼 다뤄야 함!)

---

## 🔴 7단계: 보안 확인

- [ ] `JWT_SECRET`이 강력한 랜덤 문자열인지 확인 (32자 이상)
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] HTTPS가 모든 도메인에서 활성화되어 있는지 확인
- [ ] CORS 설정이 올바른 도메인으로 제한되어 있는지 확인

---

## 📋 빠른 점검 명령어

### 백엔드 상태 확인

```bash
# Health Check
curl https://problems-backend-s622.onrender.com/health

# 또는 브라우저에서 접속
```

### 환경 변수 확인

- **Render**: Dashboard → Environment
- **Vercel**: Dashboard → Settings → Environment Variables

### 로그 확인

- **Render**: Dashboard → Logs 탭
- **Vercel**: Dashboard → Deployments → 최신 배포 → View Function Logs

---

## 🚨 문제 해결

### 백엔드가 응답하지 않는 경우

1. **Render Logs 확인**
   - Dashboard → Logs 탭에서 에러 메시지 확인

2. **환경 변수 확인**
   - `DATABASE_URL`이 올바른지 확인
   - `JWT_SECRET`이 설정되어 있는지 확인

3. **마이그레이션 확인**
   - 데이터베이스 마이그레이션이 실행되었는지 확인

4. **Render 무료 플랜 슬리프 모드**
   - 무료 플랜은 15분 비활성 시 슬리프 모드로 전환
   - 첫 요청 시 깨어나는데 시간이 걸릴 수 있음 (약 30초)

### CORS 오류 발생 시

1. Render 환경 변수 `FRONTEND_URL` 확인
2. Vercel URL이 정확히 입력되어 있는지 확인 (https 포함)
3. 백엔드 재시작 (Render Dashboard → Manual Deploy)

### 데이터베이스 연결 오류

1. `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 데이터베이스 비밀번호 확인

---

## ✅ 완료 체크리스트

배포 후 설정이 완료되었는지 확인:

- [ ] Render 환경 변수 모두 설정 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 백엔드 Health Check 성공
- [ ] 프론트엔드 정상 로드
- [ ] CORS 오류 없음
- [ ] 회원가입/로그인 테스트 성공
- [ ] (선택) 이메일 인증 설정 완료
- [ ] (선택) 파일 업로드 설정 완료

---

## 📝 다음 단계

모든 설정이 완료되면:

1. **사용자 가이드 작성** (필요 시)
2. **API 문서화** (필요 시)
3. **모니터링 설정** (UptimeRobot 등)
4. **백업 전략 수립**
5. **성능 최적화**

---

## 🔗 유용한 링크

- **Render 대시보드**: https://dashboard.render.com
- **Vercel 대시보드**: https://vercel.com/dashboard
- **Supabase 대시보드**: https://app.supabase.com
- **백엔드 URL**: https://problems-backend-s622.onrender.com
- **프론트엔드 URL**: (Vercel에서 확인)

