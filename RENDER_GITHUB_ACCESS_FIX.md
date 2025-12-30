# Render GitHub 저장소 접근 문제 해결하기

## 문제 상황

Render에서 다음과 같은 메시지가 나타나는 경우:
> "It looks like we don't have access to your repo, but we'll try to clone it anyway."

이것은 Render가 GitHub 저장소에 접근할 수 없다는 의미입니다.

## 원인

1. **GitHub 계정이 Render에 연결되지 않음**
2. **저장소가 Private이고 권한이 없음**
3. **OAuth 권한이 만료되었거나 제대로 설정되지 않음**

## 해결 방법

### 방법 1: Render에서 GitHub 계정 재연결 (가장 일반적)

1. **Render 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인

2. **계정 설정 확인**
   - 우측 상단 프로필 아이콘 클릭
   - **"Account Settings"** 또는 **"Settings"** 클릭

3. **GitHub 연결 확인**
   - 왼쪽 메뉴에서 **"Connected Accounts"** 또는 **"Git"** 클릭
   - GitHub 계정이 연결되어 있는지 확인

4. **GitHub 재연결**
   - GitHub가 연결되어 있지 않다면:
     - **"Connect GitHub"** 또는 **"Connect account"** 클릭
     - GitHub 로그인 화면에서 인증
     - Render에 권한 부여 확인
   
   - 이미 연결되어 있다면:
     - **"Disconnect"** 클릭 후 다시 **"Connect GitHub"** 클릭
     - 권한 재부여

5. **권한 확인**
   - GitHub에서 Render 앱이 저장소에 접근할 수 있는 권한이 있는지 확인
   - GitHub → Settings → Applications → Authorized OAuth Apps
   - Render 앱이 있는지 확인하고, 있다면 권한 확인

### 방법 2: GitHub에서 Render 앱 권한 확인

1. **GitHub 웹사이트 접속**
   - https://github.com 로그인

2. **설정으로 이동**
   - 우측 상단 프로필 아이콘 클릭
   - **"Settings"** 클릭

3. **애플리케이션 권한 확인**
   - 왼쪽 메뉴에서 **"Applications"** → **"Authorized OAuth Apps"** 클릭
   - 또는 **"Developer settings"** → **"OAuth Apps"** 클릭

4. **Render 앱 찾기**
   - 목록에서 **"Render"** 찾기
   - 없다면 방법 1로 Render에서 연결

5. **권한 확인**
   - Render 앱 클릭
   - **"Repository access"** 확인
   - **"All repositories"** 또는 해당 저장소가 허용되어 있는지 확인

### 방법 3: 저장소가 Private인 경우

저장소가 Private인 경우, Render에 명시적으로 권한을 부여해야 합니다:

1. **GitHub 저장소 설정**
   - 저장소 페이지로 이동: `https://github.com/SimonBae5664/problems`
   - **"Settings"** 탭 클릭
   - 왼쪽 메뉴에서 **"Collaborators"** 또는 **"Manage access"** 클릭

2. **Render 앱 추가 (필요한 경우)**
   - **"Add people"** 또는 **"Add collaborator"** 클릭
   - Render 앱을 추가할 수 있는지 확인
   - (일반적으로 OAuth 앱은 Collaborator로 추가할 수 없음)

3. **대안: 저장소를 Public으로 변경 (임시)**
   - Settings → General → Danger Zone
   - **"Change visibility"** → **"Make public"**
   - 배포 완료 후 다시 Private으로 변경 가능

### 방법 4: 새 서비스 생성 시 올바른 연결

1. **Render 대시보드에서 새 서비스 생성**
   - **"New +"** 버튼 클릭
   - **"Web Service"** 선택

2. **저장소 연결 화면에서**
   - **"Connect account"** 또는 **"Connect GitHub"** 버튼이 보이면 클릭
   - GitHub 인증 완료

3. **저장소 선택**
   - 저장소 목록에서 `SimonBae5664/problems` 찾기
   - 보이지 않으면:
     - **"Refresh"** 버튼 클릭
     - 또는 GitHub 재연결 후 다시 시도

## 확인 방법

연결이 제대로 되었는지 확인:

1. **Render 대시보드에서**
   - 새 서비스 생성 시 저장소 목록에 `SimonBae5664/problems`가 보여야 함
   - 저장소를 선택할 수 있어야 함

2. **GitHub에서**
   - 저장소 → Settings → Webhooks
   - Render 관련 webhook이 있는지 확인 (자동 배포용)

## 문제가 계속되는 경우

1. **Render 지원팀에 문의**
   - Render 대시보드 → Help → Contact Support
   - 문제 설명: "Cannot access GitHub repository"

2. **GitHub 지원팀에 문의**
   - GitHub → Settings → Support
   - OAuth 앱 권한 문제인지 확인

3. **임시 해결책: 수동 배포**
   - Render에서 "Manual Deploy" 옵션 사용
   - 또는 Git URL 직접 입력 (HTTPS)

## 예방 방법

1. **정기적으로 권한 확인**
   - Render와 GitHub 연결 상태 주기적으로 확인

2. **저장소 접근 권한 명확히 설정**
   - Private 저장소의 경우, Render 앱에 명시적으로 권한 부여

3. **OAuth 토큰 갱신**
   - 권한이 만료되기 전에 재연결

## 빠른 체크리스트

- [ ] Render 대시보드에서 GitHub 계정이 연결되어 있는가?
- [ ] GitHub에서 Render OAuth 앱이 승인되어 있는가?
- [ ] 저장소가 Private인가? (Public이면 문제 없음)
- [ ] 저장소 이름이 정확한가? (`SimonBae5664/problems`)
- [ ] GitHub 인증이 만료되지 않았는가?

## 다음 단계

GitHub 연결이 완료되면:
1. Render에서 새 서비스 생성
2. 저장소 선택 (`SimonBae5664/problems`)
3. Root Directory: `backend` 설정
4. 나머지 설정 완료 (RENDER_BACKEND_SETUP.md 참고)

