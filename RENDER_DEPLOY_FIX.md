# Render 배포 실패 해결 가이드

"error Command failed with exit code 1" 오류 해결 방법입니다.

## 1단계: 로그 확인 (가장 중요!)

Render 대시보드에서:
1. 서비스 선택 → **"Logs"** 탭 클릭
2. 빨간색 오류 메시지 확인
3. 어떤 단계에서 실패했는지 확인:
   - `npm install` 실패?
   - `prisma generate` 실패?
   - `npm run build` (TypeScript 컴파일) 실패?
   - `npm start` 실패?

## 2단계: 일반적인 문제 해결

### 문제 1: Prisma Generate 실패

**증상**: `prisma generate` 오류

**원인**: `DATABASE_URL` 환경 변수가 없거나 잘못됨

**해결**:
1. Render → Environment 탭
2. `DATABASE_URL` 확인:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Supabase에서 연결 문자열 다시 복사하여 설정

### 문제 2: TypeScript 컴파일 오류

**증상**: `tsc` 오류, 타입 오류

**해결**:
1. 로컬에서 빌드 테스트:
   ```bash
   cd backend
   npm install
   npm run build
   ```
2. 오류가 있으면 수정
3. 커밋 및 푸시 후 재배포

### 문제 3: 의존성 설치 실패

**증상**: `npm install` 오류

**해결**:
1. `package.json` 확인
2. `package-lock.json`이 있는지 확인
3. 필요시 로컬에서:
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   git add package-lock.json
   git commit -m "Update package-lock.json"
   git push
   ```

### 문제 4: 환경 변수 누락

**증상**: 런타임 오류, `JWT_SECRET is not defined` 등

**해결**:
Render → Environment 탭에서 필수 변수 확인:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL`

## 3단계: Build Command 확인

Render Settings에서 Build Command가 정확한지 확인:

**중요**: Render가 yarn을 사용하려고 하면 명시적으로 npm 사용:

```
npm install && npm run prisma:generate && npm run build
```

또는 더 명시적으로:

```
npm ci && npm run prisma:generate && npm run build
```

**yarn 오류가 발생하는 경우**:
- Build Command 앞에 `npm` 명시
- 또는 `.npmrc` 파일 추가 (이미 추가됨)

**주의**: 
- `prisma:generate`는 `DATABASE_URL`이 필요할 수 있음
- 하지만 보통은 스키마만 있으면 생성 가능
- 그래도 실패하면 Build Command에서 제거하고 Start Command에서만 실행:

**Build Command**:
```
npm install && npm run build
```

**Start Command**:
```
npm run prisma:generate && npm start
```

## 4단계: Start Command 확인

Render Settings에서 Start Command 확인:

```
npm run prisma:generate && npm start
```

또는 (prisma:generate가 빌드 시 실패하는 경우):

```
npm start
```

## 5단계: 로컬에서 테스트

배포 전 로컬에서 테스트:

```bash
cd backend

# 1. 의존성 설치
npm install

# 2. Prisma 생성 (DATABASE_URL 필요)
npm run prisma:generate

# 3. 빌드
npm run build

# 4. 빌드 성공 확인
ls -la dist/

# 5. 시작 (환경 변수 필요)
# .env 파일에 DATABASE_URL 등 설정 후
npm start
```

모든 단계가 성공하면 Render에서도 성공할 가능성이 높습니다.

## 6단계: 재배포

1. 문제 수정 후 GitHub에 푸시
2. Render에서 **"Manual Deploy"** 클릭
3. 또는 자동 재배포 대기

## 빠른 체크리스트

- [ ] Render Logs에서 정확한 오류 메시지 확인
- [ ] 로컬에서 `npm run build` 성공하는지 확인
- [ ] `DATABASE_URL` 환경 변수 설정 확인
- [ ] `JWT_SECRET` 환경 변수 설정 확인
- [ ] Build Command 확인
- [ ] Start Command 확인
- [ ] `package-lock.json`이 Git에 포함되어 있는지 확인

## 자주 발생하는 오류

### "Cannot find module '@prisma/client'"
→ Build Command에 `npm run prisma:generate` 포함 확인

### "JWT_SECRET is not defined"
→ Environment에 `JWT_SECRET` 추가

### "Database connection failed"
→ `DATABASE_URL` 확인, Supabase 프로젝트 활성화 확인

### "Type error: ..."
→ TypeScript 오류, 로컬에서 수정 후 푸시

## 도움이 필요하면

Render Logs의 전체 오류 메시지를 복사해서 공유해주시면 더 정확한 해결책을 제시할 수 있습니다.

