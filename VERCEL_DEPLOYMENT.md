# Vercel 프론트엔드 배포 가이드

이 문서는 Vercel에 프론트엔드를 배포하는 방법을 설명합니다.

## 사전 준비사항

1. **Vercel 계정 생성**
   - [vercel.com](https://vercel.com)에서 계정 생성
   - GitHub 계정으로 연동 권장

2. **백엔드 URL 확인**
   - 배포된 백엔드 API URL을 확인하세요
   - 예: `https://your-backend.railway.app` 또는 `https://api.yourdomain.com`

## 배포 방법

### 방법 1: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm install -g vercel
   ```

2. **프론트엔드 디렉토리로 이동**
   ```bash
   cd frontend
   ```

3. **Vercel 로그인**
   ```bash
   vercel login
   ```

4. **프로젝트 배포**
   ```bash
   vercel
   ```
   
   - 프로젝트 이름 설정
   - 프레임워크는 자동으로 Vite로 감지됨
   - Root Directory: `frontend` (루트에서 배포하는 경우)

5. **환경 변수 설정**
   ```bash
   vercel env add VITE_API_URL
   ```
   - 값 입력: 백엔드 API URL (예: `https://your-backend.railway.app`)

6. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

### 방법 2: Vercel 웹 대시보드 사용

#### 1단계: GitHub 저장소 준비 (중요!)

⚠️ **먼저 확인**: GitHub 저장소에 코드가 푸시되어 있어야 합니다.

**저장소가 비어있거나 오류가 발생하는 경우:**

1. **변경사항 커밋 및 푸시**
   ```bash
   cd /Users/simonjeb/github/problems
   git add .
   git commit -m "Add frontend deployment configuration"
   git push origin main
   ```

2. **원격 저장소 확인**
   - GitHub에서 저장소가 비어있지 않은지 확인
   - `main` 또는 `master` 브랜치가 있는지 확인
   - 최신 커밋이 푸시되었는지 확인

3. **Vercel 권한 확인**
   - Vercel이 GitHub 저장소에 접근할 수 있는 권한이 있는지 확인
   - Settings → Git → 연결된 저장소 확인

#### 2단계: 프로젝트 가져오기

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 저장소 선택
3. **Import** 클릭

**오류 발생 시:**
- "The provided GitHub repository does not contain the requested branch or commit reference" 오류가 나면:
  1. 위의 "GitHub 저장소 준비" 단계를 먼저 완료
  2. GitHub에서 저장소가 제대로 보이는지 확인
  3. Vercel에서 GitHub 재연결 시도

#### 3단계: 프로젝트 설정 (중요!)

프로젝트를 import한 후 **Configure Project** 화면에서:

- **Framework Preset**: Vite (자동 감지됨, 변경 불필요)
- **Root Directory**: 
  - 🔍 **찾는 방법**: "Root Directory" 옆에 있는 폴더 아이콘 클릭
  - 또는 직접 입력: `frontend` 입력
  - 💡 **만약 선택할 수 없다면**: 일단 Deploy 후 Settings에서 변경 (아래 참고)
- **Build Command**: `npm run build` (자동 설정됨)
- **Output Directory**: `dist` (자동 설정됨)
- **Install Command**: `npm install` (자동 설정됨)

**Root Directory를 찾을 수 없는 경우:**
- 일단 **Deploy** 버튼을 클릭하여 프로젝트 생성
- 배포가 완료되면 Settings에서 변경 (아래 "Root Directory 나중에 설정하기" 참고)

#### 4단계: 환경 변수 설정 (배포 후)

⚠️ **중요**: 환경 변수는 프로젝트가 생성된 **후**에 설정합니다.

1. 프로젝트 대시보드로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Environment Variables** 클릭
4. **Add New** 버튼 클릭
5. 입력:
   - **Key**: `VITE_API_URL`
   - **Value**: 백엔드 API URL (예: `https://your-backend.railway.app`)
   - **Environment**: 
     - 드롭다운이나 체크박스로 선택
     - 또는 "All Environments" 선택
     - 💡 **권장**: Production, Preview, Development 모두 선택
6. **Save** 클릭
7. **재배포 필요**: 환경 변수 추가 후 자동으로 재배포되지 않으므로, 수동으로 재배포하거나 새 커밋을 푸시해야 합니다

#### 5단계: Root Directory 나중에 설정하기 (필요한 경우)

만약 처음에 Root Directory를 설정하지 못했다면:

1. 프로젝트 대시보드 → **Settings** 탭
2. 왼쪽 메뉴에서 **General** 클릭
3. **Root Directory** 섹션 찾기
4. **Edit** 클릭
5. `frontend` 입력 또는 선택
6. **Save** 클릭
7. 자동으로 재배포됩니다

## Vercel Environment 개념

Vercel은 세 가지 배포 환경을 제공합니다:

| Environment | 설명 | 언제 사용? |
|------------|------|-----------|
| **Production** | 실제 서비스 환경 | `main` 또는 `master` 브랜치에 푸시할 때 |
| **Preview** | 테스트/검토 환경 | 다른 브랜치에 푸시하거나 Pull Request 생성 시 |
| **Development** | 로컬 개발 환경 | `vercel dev` 명령어로 로컬에서 실행할 때 |

**환경 변수 설정 시:**
- 각 환경마다 다른 값을 설정할 수 있습니다
- 예: Development는 로컬 백엔드(`http://localhost:5000`), Production은 실제 백엔드 URL
- 하지만 대부분의 경우 **모든 환경에서 동일한 백엔드 URL을 사용**하므로 세 가지 모두 선택하는 것이 일반적입니다

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_URL` | 백엔드 API URL | `https://your-backend.railway.app` |

### 환경 변수 설정 방법

1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Environment Variables** 클릭
4. **Add New** 버튼 클릭
5. 입력:
   - **Key** 또는 **Name**: `VITE_API_URL`
   - **Value**: 백엔드 API URL (예: `https://your-backend.railway.app`)
   - **Environment**: 
     - UI에 따라 다를 수 있습니다:
       - 체크박스가 보이면: Production, Preview, Development 모두 체크
       - 드롭다운이 보이면: "All Environments" 선택
       - 토글 스위치가 보이면: 각각 켜기
       - 💡 **보이지 않으면**: 일단 저장하고, 나중에 각 환경별로 따로 추가할 수도 있습니다
   
   **왜 모두 선택하나요?**
   - Production: 실제 사용자가 사용하는 환경
   - Preview: PR 테스트 시에도 백엔드 연결 필요
   - Development: 로컬에서도 동일한 백엔드로 테스트 가능
   - 💡 **대부분의 경우 세 가지 모두 선택하는 것이 좋습니다**

6. **Save** 또는 **Add** 클릭
7. **재배포 필요**: 
   - 환경 변수 변경 후 자동 재배포되지 않음
   - **Deployments** 탭에서 **Redeploy** 클릭하거나
   - 새 커밋을 푸시하면 자동 배포됨

## 배포 후 확인사항

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 클릭
   - Build Logs에서 빌드 오류 확인

2. **환경 변수 확인**
   - 배포된 사이트에서 브라우저 개발자 도구 열기
   - Console에서 `import.meta.env.VITE_API_URL` 확인

3. **API 연결 테스트**
   - 로그인/회원가입 기능 테스트
   - 네트워크 탭에서 API 요청이 올바른 URL로 가는지 확인

## CORS 설정

백엔드에서 Vercel 도메인을 허용해야 합니다:

```
https://your-frontend.vercel.app
```

백엔드 CORS 설정에 위 도메인을 추가하세요.

## 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. Add Domain 클릭
3. 도메인 입력 및 DNS 설정 안내 따르기

## 자동 배포 설정

GitHub와 연동된 경우:
- `main` 브랜치에 푸시 → Production 배포
- 다른 브랜치에 푸시 → Preview 배포
- Pull Request 생성 → Preview 배포

## 문제 해결

### GitHub 저장소 오류: "does not contain the requested branch or commit reference"

이 오류는 보통 다음 이유로 발생합니다:

1. **저장소가 비어있음**
   ```bash
   # 모든 변경사항 커밋 및 푸시
   git add .
   git commit -m "Initial commit with frontend"
   git push origin main
   ```

2. **main/master 브랜치가 없음**
   ```bash
   # 현재 브랜치 확인
   git branch
   
   # main 브랜치로 전환 (필요시)
   git checkout -b main
   git push -u origin main
   ```

3. **Vercel 권한 문제**
   - Vercel 대시보드 → Settings → Git
   - GitHub 재연결 시도
   - 저장소 접근 권한 확인

4. **저장소가 아직 푸시되지 않음**
   - 로컬에만 있고 GitHub에 없는 경우
   - 위의 git push 명령어로 푸시

**확인 방법:**
- GitHub 웹사이트에서 저장소 접속
- 파일이 보이고 `main` 브랜치가 있는지 확인
- 최신 커밋이 있는지 확인

### Root Directory를 설정할 수 없는 경우

**방법 1: Settings에서 설정**
1. 프로젝트 배포 후 → **Settings** → **General**
2. **Root Directory** 섹션 찾기
3. **Edit** 클릭 → `frontend` 입력 → **Save**

**방법 2: 프로젝트 루트에 vercel.json 생성**
프로젝트 루트(`/Users/simonjeb/github/problems/`)에 `vercel.json` 파일 생성:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install"
}
```
⚠️ **주의**: 이 방법은 `frontend/vercel.json`과 충돌할 수 있으므로, Settings에서 설정하는 것이 더 안전합니다.

**방법 3: frontend 폴더에서 직접 배포**
- GitHub에서 `frontend` 폴더만 별도 저장소로 분리하거나
- CLI로 `frontend` 디렉토리에서 직접 배포

### 환경 변수 Environment 선택이 안 보이는 경우

Vercel UI가 업데이트되면서 환경 선택 방식이 달라질 수 있습니다:

1. **드롭다운 방식**: "All Environments" 선택
2. **체크박스 없음**: 일단 저장하고, 나중에 각 환경별로 추가
3. **자동 적용**: 저장하면 모든 환경에 자동 적용될 수도 있음

**확인 방법:**
- 환경 변수 저장 후 → **Deployments** → 새 배포 확인
- 브라우저 콘솔에서 `import.meta.env.VITE_API_URL` 확인

### 빌드 실패

1. **TypeScript 오류**
   ```bash
   cd frontend
   npm run build
   ```
   로컬에서 빌드하여 오류 확인

2. **의존성 오류**
   - `package.json`의 의존성 버전 확인
   - `package-lock.json`이 최신인지 확인

### API 연결 실패

1. **환경 변수 확인**
   - Vercel 대시보드에서 `VITE_API_URL` 설정 확인
   - 재배포 필요

2. **CORS 오류**
   - 백엔드 CORS 설정에 Vercel 도메인 추가
   - 네트워크 탭에서 오류 메시지 확인

3. **HTTPS/HTTP 혼용**
   - 백엔드가 HTTPS를 사용하는지 확인
   - 프론트엔드는 항상 HTTPS로 배포됨

### 라우팅 문제 (404 오류)

- `vercel.json`의 `rewrites` 설정이 올바른지 확인
- 모든 경로가 `/index.html`로 리다이렉트되는지 확인

## 참고사항

- Vercel은 Vite를 자동으로 감지하므로 `vercel.json`의 일부 설정은 불필요합니다
- 환경 변수는 빌드 시점에 주입되므로, 변경 후 재배포가 필요합니다
- Preview 배포는 PR마다 자동으로 생성되어 테스트할 수 있습니다

