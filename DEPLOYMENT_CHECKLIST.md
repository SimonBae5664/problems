# 배포 체크리스트

프로덕션 배포 전 확인사항을 체크하세요.

## 사전 준비

- [ ] Supabase 프로젝트가 생성되고 활성화되어 있음
- [ ] 데이터베이스 마이그레이션이 완료됨
- [ ] 로컬 환경에서 모든 기능이 정상 작동함

## 환경 변수 준비

### Backend 필수 변수

- [ ] `DATABASE_URL` - Supabase 연결 문자열
- [ ] `JWT_SECRET` - 강력한 랜덤 문자열 (32자 이상)
- [ ] `FRONTEND_URL` - Frontend 배포 URL
- [ ] `NODE_ENV=production`

### Backend 선택적 변수

- [ ] OAuth 설정 (Google/Kakao 사용 시)
- [ ] 파일 스토리지 설정 (S3/R2/Supabase 사용 시)
- [ ] 이메일 설정 (이메일 인증 사용 시)

### Frontend 변수

- [ ] `VITE_API_URL` - Backend 배포 URL

## Frontend 배포 (Vercel)

- [ ] Vercel 계정 생성 및 GitHub 연동
- [ ] 프로젝트 생성 (Root Directory: `frontend`)
- [ ] 환경 변수 `VITE_API_URL` 설정
- [ ] 배포 완료 및 URL 확인
- [ ] 커스텀 도메인 설정 (선택사항)

## Backend 배포 (Railway/Render)

- [ ] Railway 또는 Render 계정 생성
- [ ] 프로젝트 생성 및 GitHub 저장소 연결
- [ ] Root Directory를 `backend`로 설정
- [ ] Build Command 설정 확인
- [ ] Start Command 설정 확인
- [ ] 모든 환경 변수 추가
- [ ] 배포 완료 및 URL 확인
- [ ] 데이터베이스 마이그레이션 실행 확인
- [ ] Health check 엔드포인트 확인 (`/health`)

## OAuth 설정 업데이트

- [ ] Google OAuth 콜백 URL 업데이트
- [ ] Kakao OAuth 콜백 URL 업데이트
- [ ] OAuth 앱 설정에서 도메인 허용 목록 확인

## 배포 후 테스트

- [ ] Frontend 접속 확인
- [ ] Backend Health Check 확인
- [ ] 회원가입 기능 테스트
- [ ] 로그인 기능 테스트
- [ ] OAuth 로그인 테스트 (사용 시)
- [ ] 문제 업로드 기능 테스트
- [ ] 파일 업로드 기능 테스트 (사용 시)
- [ ] 이메일 인증 테스트 (사용 시)
- [ ] 댓글 기능 테스트
- [ ] 관리자 기능 테스트

## 보안 확인

- [ ] `.env` 파일이 Git에 커밋되지 않음
- [ ] `JWT_SECRET`이 강력한 랜덤 문자열임
- [ ] HTTPS가 모든 도메인에서 활성화됨
- [ ] CORS 설정이 올바른 도메인으로 제한됨
- [ ] 환경 변수가 배포 플랫폼에 안전하게 저장됨

## 모니터링 설정 (선택사항)

- [ ] 에러 로깅 서비스 설정 (Sentry 등)
- [ ] 성능 모니터링 설정
- [ ] 업타임 모니터링 설정

## 문서화

- [ ] 배포 URL 문서화
- [ ] 팀원에게 배포 정보 공유
- [ ] 사용자 가이드 업데이트 (필요 시)

## 롤백 계획

- [ ] 이전 버전으로 롤백하는 방법 확인
- [ ] 데이터베이스 백업 확인

