# .env 파일 수정 필요

## 문제

DATABASE_URL에 따옴표가 포함되어 있어 Prisma가 연결 문자열을 인식하지 못합니다.

## 해결 방법

`backend/.env` 파일을 열어서 다음 줄을 수정하세요:

### 현재 (잘못된 형식):
```env
DATABASE_URL="postgresql://postgres:[hevqu7-zorVyw-boxfih]@db.peimyopacpqkbwxofmtd.supabase.co:5432/postgres
```

### 수정 후 (올바른 형식):
```env
DATABASE_URL=postgresql://postgres:[hevqu7-zorVyw-boxfih]@db.peimyopacpqkbwxofmtd.supabase.co:5432/postgres
```

**중요**: 따옴표(`"`)를 제거하세요!

## 확인

수정 후 다음 명령어로 확인:

```bash
cd backend
npm run prisma:migrate
```

성공하면 마이그레이션이 실행됩니다.

