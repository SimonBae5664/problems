# OAuth 설정 가이드 (Google & Kakao)

이 애플리케이션은 Passport.js를 사용하여 Google과 Kakao OAuth 로그인을 지원합니다. Supabase Auth가 아닌 자체 JWT 인증 시스템을 사용합니다.

## 1. Google OAuth 설정

### 1.1 Google Cloud Console에서 프로젝트 생성

1. https://console.cloud.google.com 접속
2. 상단 프로젝트 선택 > "새 프로젝트" 클릭
3. 프로젝트 이름 입력 후 "만들기" 클릭

### 1.2 OAuth 동의 화면 설정

1. 좌측 메뉴 > **API 및 서비스** > **OAuth 동의 화면** 클릭
2. 사용자 유형 선택: **외부** (개인 Google 계정 사용 시)
3. 앱 정보 입력:
   - 앱 이름: `Problems Community` (원하는 이름)
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. "저장 후 계속" 클릭
5. 범위(Scopes) 설정: 기본값 유지 또는 다음 추가
   - `userinfo.email`
   - `userinfo.profile`
6. "저장 후 계속" 클릭
7. 테스트 사용자 추가 (외부 사용자 유형인 경우): 본인 이메일 추가
8. "대시보드로 돌아가기" 클릭

### 1.3 OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴 > **API 및 서비스** > **사용자 인증 정보** 클릭
2. 상단 "사용자 인증 정보 만들기" > **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `Problems Community Web Client` (원하는 이름)
5. 승인된 리디렉션 URI 추가:
   - 개발 환경: `http://localhost:5000/api/auth/google/callback`
   - 프로덕션 환경: `https://yourdomain.com/api/auth/google/callback`
6. "만들기" 클릭
7. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사 (나중에 다시 볼 수 없으므로 잘 보관!)

## 2. Kakao OAuth 설정

### 2.1 Kakao Developers에서 앱 등록

1. https://developers.kakao.com 접속
2. 로그인 후 "내 애플리케이션" 클릭
3. "애플리케이션 추가하기" 클릭
4. 앱 정보 입력:
   - 앱 이름: `Problems Community` (원하는 이름)
   - 사업자명: 개인/회사명
5. "저장" 클릭

### 2.2 플랫폼 설정

1. 생성된 앱 선택
2. 좌측 메뉴 > **앱 설정** > **플랫폼** 클릭
3. "Web 플랫폼 등록" 클릭
4. 사이트 도메인 입력:
   - 개발 환경: `http://localhost:5000`
   - 프로덕션 환경: `https://yourdomain.com`
5. "저장" 클릭

### 2.3 카카오 로그인 활성화

1. 좌측 메뉴 > **제품 설정** > **카카오 로그인** 클릭
2. "활성화 설정" ON
3. Redirect URI 등록:
   - 개발 환경: `http://localhost:5000/api/auth/kakao/callback`
   - 프로덕션 환경: `https://yourdomain.com/api/auth/kakao/callback`
4. "저장" 클릭

### 2.4 동의 항목 설정

1. 좌측 메뉴 > **제품 설정** > **카카오 로그인** > **동의항목** 클릭
2. 필수 동의 항목 설정:
   - **닉네임**: 필수
   - **카카오계정(이메일)**: 필수 (선택 동의로 설정 가능)
3. "저장" 클릭

### 2.5 REST API 키 확인

1. 좌측 메뉴 > **앱 설정** > **앱 키** 클릭
2. **REST API 키** 복사 (이것이 Client ID입니다)

## 3. .env 파일 설정

`backend/.env` 파일을 생성하거나 수정하여 다음 환경 변수를 추가하세요:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Kakao OAuth
OAUTH_KAKAO_CLIENT_ID=your-kakao-rest-api-key
OAUTH_KAKAO_CALLBACK_URL=http://localhost:5000/api/auth/kakao/callback
```

**중요 사항:**
- `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있어야 합니다)
- 프로덕션 환경에서는 실제 도메인으로 변경하세요
- `JWT_SECRET`은 강력한 랜덤 문자열로 변경하세요

## 4. 확인

설정이 완료되면:

1. 백엔드 서버 재시작
2. 프론트엔드에서 로그인 페이지 접속
3. "구글로 로그인" 또는 "카카오로 로그인" 버튼 클릭
4. OAuth 인증 플로우가 정상적으로 작동하는지 확인

## 5. 문제 해결

### Google OAuth가 작동하지 않는 경우

- Redirect URI가 정확히 일치하는지 확인 (http/https, 포트, 경로)
- OAuth 동의 화면에서 테스트 사용자로 등록했는지 확인
- 클라이언트 ID와 Secret이 올바른지 확인

### Kakao OAuth가 작동하지 않는 경우

- Redirect URI가 정확히 일치하는지 확인
- 카카오 로그인이 활성화되어 있는지 확인
- REST API 키가 올바른지 확인
- 동의 항목에서 이메일이 필수 또는 선택 동의로 설정되어 있는지 확인

### 환경 변수가 적용되지 않는 경우

- 백엔드 서버를 재시작했는지 확인
- `.env` 파일이 `backend/` 디렉토리에 있는지 확인
- 환경 변수 이름에 오타가 없는지 확인

