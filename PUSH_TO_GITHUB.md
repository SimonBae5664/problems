# GitHub에 푸시하는 방법

## 빠른 해결 방법

### 방법 1: GitHub Desktop 사용 (가장 쉬움)

1. GitHub Desktop 앱 다운로드 및 설치
   - https://desktop.github.com/
2. 앱 실행 후:
   - `File → Add Local Repository`
   - `/Users/simonjeb/github/problems` 선택
3. "Publish repository" 또는 "Push origin" 클릭

### 방법 2: Personal Access Token 사용

1. GitHub 웹사이트 접속
2. 우측 상단 프로필 → **Settings**
3. 왼쪽 메뉴 → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token (classic)** 클릭
6. 설정:
   - **Note**: "Vercel Deployment" (아무 이름)
   - **Expiration**: 원하는 기간 선택
   - **Scopes**: `repo` 체크 (모든 repo 권한)
7. **Generate token** 클릭
8. **토큰 복사** (한 번만 보여줌!)

9. 터미널에서 실행:
```bash
cd /Users/simonjeb/github/problems
git push https://YOUR_TOKEN@github.com/SimonBae5664/problems.git main
```
(YOUR_TOKEN을 실제 토큰으로 교체)

### 방법 3: SSH 사용

```bash
# SSH 키 확인
ls -la ~/.ssh

# SSH 키가 없으면 생성
ssh-keygen -t ed25519 -C "your_email@example.com"
# 엔터 여러 번 (비밀번호 없이 사용하려면)

# 공개키 복사
cat ~/.ssh/id_ed25519.pub
# 출력된 내용 전체 복사

# GitHub에 추가:
# 1. GitHub → Settings → SSH and GPG keys
# 2. New SSH key 클릭
# 3. 복사한 키 붙여넣기

# 원격 URL 변경
cd /Users/simonjeb/github/problems
git remote set-url origin git@github.com:SimonBae5664/problems.git

# 푸시
git push -u origin main
```

## 푸시 확인

```bash
# 원격 브랜치 확인
git ls-remote --heads origin

# main이 보이면 성공!
```

## 푸시 후 Vercel에서

1. 푸시 완료 후 1-2분 대기
2. Vercel에서 다시 Import 시도
3. 또는 Vercel → Settings → Git → 재연결

