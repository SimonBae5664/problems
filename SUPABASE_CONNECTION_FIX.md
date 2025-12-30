# Supabase 연결 문제 해결 가이드

## 현재 상태
- ✅ Supabase 프로젝트 URL 추가됨: `https://peimyopacpqkbwxofmtd.supabase.co`
- ✅ Supabase API 키 추가됨
- ❌ 데이터베이스 연결 실패

## 해결 방법

### 1. Supabase 대시보드에서 연결 문자열 확인

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (peimyopacpqkbwxofmtd)
3. 좌측 메뉴에서 **Settings** 클릭
4. **Database** 메뉴 클릭
5. **Connection string** 섹션에서 **URI** 탭 선택
6. 연결 문자열 복사

### 2. 프로젝트 활성화 확인

Supabase 무료 플랜은 일정 시간 비활성 시 프로젝트가 일시 중지됩니다.

- 대시보드에서 프로젝트 상태 확인
- "Paused" 상태라면 "Restore project" 클릭
- 프로젝트가 완전히 활성화될 때까지 대기 (몇 분 소요)

### 3. .env 파일 수정

`backend/.env` 파일의 `DATABASE_URL`을 Supabase 대시보드에서 복사한 연결 문자열로 교체:

```env
DATABASE_URL=postgresql://postgres:[실제비밀번호]@db.peimyopacpqkbwxofmtd.supabase.co:5432/postgres
```

**중요**: 
- 비밀번호에 특수문자가 있으면 URL 인코딩이 필요할 수 있습니다
- Supabase 대시보드에서 제공하는 연결 문자열을 그대로 사용하는 것이 가장 안전합니다

### 4. 연결 테스트

```bash
cd backend
npx prisma db pull
```

성공하면 데이터베이스 스키마를 가져옵니다.

### 5. 마이그레이션 실행

연결이 성공하면:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `init` 입력

## 현재 .env 설정

```
DATABASE_URL=postgresql://postgres:[hevqu7-zorVyw-boxfih]@db.peimyopacpqkbwxofmtd.supabase.co:5432/postgres
SUPABASE_URL=https://peimyopacpqkbwxofmtd.supabase.co
SUPABASE_ANON_KEY=sb_publishable_t-nEVB6nxa-Fm-R-Oc8Tlw_b6taxX6D
```

## 문제 해결 체크리스트

- [ ] Supabase 프로젝트가 활성화되어 있는가?
- [ ] 대시보드에서 연결 문자열을 다시 복사했는가?
- [ ] 비밀번호가 올바른가?
- [ ] 네트워크 연결이 정상인가?

