# Render에서 Supabase 데이터베이스 연결하기

Render는 자체 PostgreSQL 데이터베이스를 제공하지만, **Supabase를 사용하는 경우 환경 변수로 직접 입력**해야 합니다.

## 단계별 가이드

### 1단계: Supabase에서 연결 문자열 가져오기

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **Database 설정으로 이동**
   - 좌측 메뉴 → **Settings** 클릭
   - **Database** 메뉴 클릭

3. **Connection Pooling 설정**
   - **Connection Pooling** 섹션 찾기
   - **Session mode** 선택 (⚠️ 중요: Transaction mode는 IPv6만 지원)
   - **Connection string** 섹션으로 이동

4. **Session Pooler URL 복사**
   - **Connection string** 섹션에서 **Session mode** 탭 선택
   - **URI** 형식의 연결 문자열 복사
   
   형식 예시 (Session Pooler):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?connection_limit=5&pool_timeout=20
   ```
   
   또는 Direct connection (포트 5432):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?connection_limit=5&pool_timeout=20
   ```
   
   **중요**: 
   - **Session Pooler 권장**: IPv4 지원, 연결 풀링 (최대 200개), Render와 호환
   - **Transaction Pooler 비권장**: IPv6만 지원, Render의 IPv4 네트워크와 호환 안 됨
   - `[YOUR-PASSWORD]`는 실제 데이터베이스 비밀번호
   - 비밀번호에 특수문자가 있으면 URL 인코딩 필요할 수 있음
   - `connection_limit=5&pool_timeout=20` 파라미터 추가 권장

### 2단계: Render에서 환경 변수 추가

1. **Render 대시보드 접속**
   - https://dashboard.render.com 접속
   - 백엔드 서비스 선택

2. **Environment 탭으로 이동**
   - 좌측 메뉴에서 **Environment** 클릭
   - 또는 상단 탭에서 **Environment** 선택

3. **환경 변수 추가**
   - **Add Environment Variable** 버튼 클릭
   - 또는 **+ Add** 버튼 클릭

4. **DATABASE_URL 입력 (Session Pooler 사용 시)**
   - **Key**: `DATABASE_URL` 입력
   - **Value**: Supabase에서 복사한 **Session Pooler** 연결 문자열 붙여넣기
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?connection_limit=5&pool_timeout=20
     ```
   - **Save** 클릭
   
   **Session Pooler URL 형식:**
   - 호스트: `aws-0-[REGION].pooler.supabase.com` (또는 `aws-1-[REGION].pooler.supabase.com`)
   - 포트: `6543`
   - 사용자: `postgres.[PROJECT-REF]` (프로젝트 참조 포함)
   - 파라미터: `?connection_limit=5&pool_timeout=20` (권장)

5. **DIRECT_URL 추가 (필수)**
   - Prisma는 Connection Pooler와 Direct connection을 모두 필요로 합니다
   - **Key**: `DIRECT_URL`
   - **Value**: **Direct connection URL** (포트 5432 사용)
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?connection_limit=1
     ```
   - **Save** 클릭
   
   **Direct connection URL 가져오기:**
   - Supabase → Settings → Database → Connection string
   - **Direct connection** 탭 선택
   - URI 형식 복사

### 3단계: 추가 환경 변수 설정

Supabase를 사용하는 경우 다음 변수들도 추가:

```env
# Supabase 설정
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]

# 스토리지 사용 시
STORAGE_TYPE=supabase
STORAGE_BUCKET=uploads
```

**SUPABASE_SERVICE_ROLE_KEY 가져오기:**
1. Supabase 대시보드 → Settings → API
2. **Project API keys** 섹션
3. **service_role** 키 복사 (⚠️ 비밀! 노출하지 말 것)

### 4단계: 서비스 재시작

환경 변수 추가 후:
1. Render 대시보드에서 **Manual Deploy** 클릭
2. 또는 자동으로 재배포될 때까지 대기

### 5단계: 연결 확인

1. **Render Logs 확인**
   - Render 대시보드 → **Logs** 탭
   - 데이터베이스 연결 오류가 없는지 확인

2. **Health Check 확인**
   - 브라우저에서 `https://your-backend.onrender.com/health` 접속
   - 정상 응답 확인

3. **마이그레이션 실행** (필요 시)
   - Render Shell에서:
     ```bash
     cd backend
     npx prisma migrate deploy
     ```

## 문제 해결

### "Invalid connection string" 오류

- Supabase 연결 문자열 형식 확인
- 비밀번호에 특수문자가 있으면 URL 인코딩 확인
- Supabase 프로젝트가 활성화되어 있는지 확인 (무료 플랜은 일시 중지될 수 있음)

### "Connection refused" 오류

- Supabase 프로젝트 상태 확인
- 프로젝트가 "Paused" 상태면 "Restore project" 클릭
- 몇 분 대기 후 다시 시도

### "Authentication failed" 오류

- 데이터베이스 비밀번호 확인
- Supabase 대시보드에서 비밀번호 재설정 가능
- 연결 문자열에 올바른 비밀번호가 포함되어 있는지 확인

## 참고사항

- **Render 자체 데이터베이스 vs Supabase**
  - Render는 자체 PostgreSQL 데이터베이스를 제공하지만, Supabase를 사용하려면 환경 변수로 직접 입력
  - Supabase의 장점: 무료 플랜, 자동 백업, 실시간 기능, Storage 등

- **환경 변수는 암호화되어 저장됨**
  - Render는 환경 변수를 안전하게 저장
  - 로그에 표시되지 않도록 주의

- **비밀번호 URL 인코딩**
  - 비밀번호에 `@`, `#`, `%` 등 특수문자가 있으면 URL 인코딩 필요
  - 예: `@` → `%40`, `#` → `%23`

## 완료 체크리스트

- [ ] Supabase에서 연결 문자열 복사
- [ ] Render에 `DATABASE_URL` 환경 변수 추가
- [ ] Render에 `DIRECT_URL` 환경 변수 추가 (선택사항)
- [ ] Render에 `SUPABASE_URL` 환경 변수 추가
- [ ] Render에 `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 추가 (필요 시)
- [ ] 서비스 재시작
- [ ] 로그에서 연결 오류 확인
- [ ] Health check 통과 확인

