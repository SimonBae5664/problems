# Render에서 백엔드 서비스 생성하기

Render에서 백엔드 서비스를 생성하는 단계별 가이드입니다.

## 1단계: Render 대시보드 접속

1. https://dashboard.render.com 접속
2. 로그인

## 2단계: 새 Web Service 생성

1. **상단의 "New +" 버튼 클릭**
2. **"Web Service" 선택**

## 3단계: GitHub 저장소 연결

⚠️ **중요**: "It looks like we don't have access to your repo" 오류가 발생하면:
- [RENDER_GITHUB_ACCESS_FIX.md](./RENDER_GITHUB_ACCESS_FIX.md) 참고

1. **"Connect account"** 또는 **"Connect GitHub"** 클릭 (아직 연결 안 했다면)
2. GitHub 계정 인증
3. 저장소 목록에서 **`SimonBae5664/problems`** 선택
4. **"Connect"** 클릭

**저장소가 보이지 않는 경우:**
- Render 대시보드 → Account Settings → Connected Accounts
- GitHub 재연결 시도
- 저장소가 Private인 경우, Public으로 임시 변경 또는 Render 앱 권한 확인

## 4단계: 서비스 설정 (중요!)

서비스 생성 화면에서 다음 설정을 입력:

### 기본 설정

- **Name**: `problems-backend` (원하는 이름)
- **Region**: `Singapore` 또는 가장 가까운 리전 선택
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **중요!** 반드시 `backend` 입력
- **Runtime**: `Node`
- **Build Command**: 
  ```
  npm install && npm run prisma:generate && npm run build
  ```
- **Start Command**: 
  ```
  npm run prisma:generate && npm start
  ```

### 환경 변수 설정

**"Advanced"** 섹션을 펼치거나, 서비스 생성 후 Environment 탭에서 추가:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=[강력한-랜덤-문자열-32자-이상]
NODE_ENV=production
FRONTEND_URL=https://frontend-phi-ivory-48.vercel.app
```

## 5단계: 서비스 생성

1. 모든 설정 확인
2. **"Create Web Service"** 클릭
3. 배포 시작 (몇 분 소요)

## 6단계: 배포 확인

1. **"Logs"** 탭에서 배포 진행 상황 확인
2. 배포 완료 후 URL 확인 (예: `https://problems-ajim.onrender.com`)
3. Health check: `https://your-service.onrender.com/health`

## 문제 해결

### Root Directory를 찾을 수 없는 경우

- Root Directory 필드에 직접 `backend` 입력
- 자동완성 목록이 나와도 직접 입력 가능

### 빌드 실패

1. **Logs** 탭에서 오류 확인
2. **Build Command** 확인:
   ```
   npm install && npm run prisma:generate && npm run build
   ```
3. **Start Command** 확인:
   ```
   npm run prisma:generate && npm start
   ```

### 환경 변수 추가

서비스 생성 후:
1. 서비스 선택
2. **Environment** 탭 클릭
3. **Add Environment Variable** 클릭
4. Key와 Value 입력 후 Save

## 완료 후

서비스가 생성되면:
- 서비스 목록에 `problems-backend` (또는 설정한 이름)가 표시됩니다
- 서비스를 클릭하면 대시보드로 이동합니다
- 여기서 Logs, Environment, Settings 등을 관리할 수 있습니다

