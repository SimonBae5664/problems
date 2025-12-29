# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인 (또는 이메일)
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - Name: `problems-community` (원하는 이름)
   - Database Password: 강력한 비밀번호 설정 (잘 보관!)
   - Region: Northeast Asia (Seoul) 선택
6. "Create new project" 클릭

## 2. 연결 정보 가져오기

1. Supabase 대시보드에서 프로젝트 선택
2. 좌측 메뉴에서 **Settings** 클릭
3. **Database** 메뉴 클릭
4. **Connection string** 섹션에서 **URI** 탭 선택
5. 연결 문자열 복사 (형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

## 3. .env 파일 설정

`backend/.env` 파일을 생성하고 다음 내용 추가:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**중요**: `[YOUR-PASSWORD]`와 `[PROJECT-REF]`를 실제 값으로 변경하세요!

## 4. Prisma 마이그레이션

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `init` 입력

## 5. 확인

Supabase 대시보드 > Table Editor에서 테이블들이 생성되었는지 확인하세요.

## 추가 기능 (선택사항)

### Supabase Storage 사용 (PDF 파일 저장)

1. Supabase 대시보드 > Storage
2. 새 버킷 생성: `problems`
3. Public으로 설정
4. `backend/.env`에 Supabase Storage 설정 추가

### Supabase Auth 사용 (향후)

현재는 JWT 인증을 사용하고 있지만, 향후 Supabase Auth로 전환 가능합니다.

