# Render에서 GitHub 저장소 접근 문제 해결하기

"It looks like we don't have access to your repo" 오류가 발생할 때 해결 방법입니다.

## 🔍 문제 원인

Render가 GitHub 저장소에 접근할 수 없는 이유:
1. **GitHub 계정이 Render에 연결되지 않음**
2. **저장소가 Private이고 Render 앱에 권한이 없음**
3. **GitHub OAuth 권한이 만료되었거나 취소됨**

## ✅ 해결 방법

### 방법 1: GitHub 계정 연결 (권장)

1. **Render 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인

2. **Account Settings로 이동**
   - 우측 상단 프로필 아이콘 클릭
   - **"Account Settings"** 선택

3. **Connected Accounts 확인**
   - 좌측 메뉴에서 **"Connected Accounts"** 클릭
   - GitHub가 연결되어 있는지 확인

4. **GitHub 연결/재연결**
   - GitHub가 연결되어 있지 않으면:
     - **"Connect GitHub"** 또는 **"Connect account"** 버튼 클릭
     - GitHub 로그인 및 권한 승인
   
   - GitHub가 이미 연결되어 있지만 저장소가 보이지 않으면:
     - **"Disconnect"** 클릭 후 다시 연결
     - 또는 **"Reconnect"** 버튼 클릭

5. **권한 확인**
   - GitHub OAuth 앱 권한에서 다음 항목이 체크되어 있는지 확인:
     - ✅ `repo` (전체 저장소 접근)
     - ✅ `read:org` (조직 저장소 접근, 필요한 경우)

### 방법 2: 저장소를 Public으로 변경 (임시)

Private 저장소인 경우:

1. **GitHub 저장소 설정**
   - https://github.com/SimonBae5664/problems 접속
   - **Settings** → **General** → **Danger Zone**
   - **"Change visibility"** → **"Make public"** 선택
   - 확인 후 Public으로 변경

2. **Render에서 저장소 선택**
   - Render 대시보드에서 새 서비스 생성
   - 저장소 목록에서 `SimonBae5664/problems` 선택

3. **다시 Private으로 변경 (선택사항)**
   - 서비스 생성 후 다시 Private으로 변경 가능
   - Render는 이미 연결된 저장소는 계속 접근 가능

### 방법 3: GitHub App 설치 (조직 저장소인 경우)

조직(Organization) 저장소인 경우:

1. **Render GitHub App 설치**
   - Render 대시보드 → Account Settings → Connected Accounts
   - **"Install Render GitHub App"** 클릭
   - 조직 선택 후 설치

2. **저장소 권한 부여**
   - 설치 시 저장소 접근 권한 선택
   - 또는 조직 설정에서 Render 앱에 권한 부여

### 방법 4: Personal Access Token 사용 (고급)

GitHub OAuth가 작동하지 않는 경우:

1. **GitHub Personal Access Token 생성**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - **"Generate new token (classic)"** 클릭
   - Token 이름: `Render Deployment`
   - 권한 선택:
     - ✅ `repo` (전체 저장소 접근)
     - ✅ `read:org` (조직 저장소, 필요한 경우)
   - **"Generate token"** 클릭
   - **토큰 복사** (한 번만 표시됨!)

2. **Render에서 토큰 사용**
   - Render는 기본적으로 OAuth를 사용하므로, 이 방법은 제한적
   - 대신 방법 1-3을 사용하는 것이 권장됨

## 🔄 저장소가 보이지 않는 경우

### 확인 사항

1. **저장소 이름 확인**
   - 정확한 저장소 이름: `SimonBae5664/problems`
   - 대소문자 구분 확인

2. **저장소 존재 확인**
   - https://github.com/SimonBae5664/problems 접속
   - 저장소가 실제로 존재하는지 확인

3. **권한 확인**
   - 저장소에 대한 읽기 권한이 있는지 확인
   - 조직 저장소인 경우 조직 멤버인지 확인

4. **GitHub 계정 확인**
   - Render에 연결된 GitHub 계정이 올바른지 확인
   - 다른 계정으로 로그인했을 수 있음

### 해결 단계

1. **Render에서 GitHub 연결 해제 후 재연결**
   ```
   Account Settings → Connected Accounts → GitHub → Disconnect
   → 다시 Connect GitHub
   ```

2. **GitHub에서 Render 앱 권한 확인**
   - GitHub → Settings → Applications → Authorized OAuth Apps
   - Render 앱이 있는지 확인
   - 권한이 올바른지 확인

3. **저장소 직접 URL로 접근**
   - Render 서비스 생성 시 저장소 URL 직접 입력 시도
   - `https://github.com/SimonBae5664/problems`

## 📝 체크리스트

문제 해결 전 확인:

- [ ] Render 대시보드에 로그인되어 있음
- [ ] GitHub 계정이 Render에 연결되어 있음
- [ ] GitHub OAuth 권한이 올바르게 설정됨
- [ ] 저장소가 존재하고 접근 가능함
- [ ] 저장소 이름이 정확함 (`SimonBae5664/problems`)
- [ ] Private 저장소인 경우 Render 앱에 권한이 있음

## 🚀 빠른 해결 (가장 빠른 방법)

1. **Render 대시보드** → **Account Settings** → **Connected Accounts**
2. GitHub가 연결되어 있으면 **"Disconnect"** 후 **"Connect GitHub"** 다시 클릭
3. GitHub 로그인 및 권한 승인
4. 새 서비스 생성 시 저장소 목록에서 `SimonBae5664/problems` 선택

## 💡 추가 팁

- **저장소가 보이지 않으면**: 페이지 새로고침(F5) 또는 브라우저 캐시 삭제
- **권한 문제**: GitHub에서 Render 앱 권한을 확인하고 필요시 재승인
- **조직 저장소**: 조직 관리자에게 Render 앱 설치 요청

## 문제가 계속되면

1. Render 지원팀에 문의: https://render.com/support
2. GitHub 저장소를 Public으로 임시 변경 (방법 2)
3. 다른 배포 플랫폼 고려 (Railway, Fly.io 등)

