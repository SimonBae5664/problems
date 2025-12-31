# Git 푸시 인증 설정 가이드

앞으로 커밋/푸시할 때 인증 문제가 발생하지 않도록 설정하는 방법입니다.

## 방법 1: SSH 키 설정 (가장 권장) ⭐

SSH 키를 설정하면 앞으로 비밀번호 없이 푸시할 수 있습니다.

### 1단계: SSH 키 확인

```bash
ls -la ~/.ssh
```

`id_ed25519` 또는 `id_rsa` 파일이 있으면 이미 키가 있는 것입니다.

### 2단계: SSH 키 생성 (없는 경우)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- 엔터 여러 번 (비밀번호 없이 사용하려면)
- 또는 비밀번호 설정 (더 안전함)

### 3단계: 공개키 복사

```bash
cat ~/.ssh/id_ed25519.pub
```

출력된 전체 내용을 복사하세요.

### 4단계: GitHub에 SSH 키 추가

1. GitHub 웹사이트 접속: https://github.com
2. 우측 상단 프로필 아이콘 클릭 → **"Settings"**
3. 왼쪽 메뉴 → **"SSH and GPG keys"**
4. **"New SSH key"** 클릭
5. 설정:
   - **Title**: "MacBook" (아무 이름)
   - **Key**: 복사한 공개키 붙여넣기
6. **"Add SSH key"** 클릭

### 5단계: 원격 URL 변경

```bash
cd /Users/simonjeb/github/problems
git remote set-url origin git@github.com:SimonBae5664/problems.git
```

### 6단계: 테스트

```bash
git push origin main
```

이제 비밀번호 없이 푸시됩니다!

---

## 방법 2: GitHub CLI 사용

GitHub CLI를 설치하면 자동으로 인증이 설정됩니다.

### 설치

```bash
brew install gh
```

### 로그인

```bash
gh auth login
```

- GitHub.com 선택
- HTTPS 선택
- 브라우저에서 인증

### 사용

```bash
git push origin main
```

---

## 방법 3: Personal Access Token을 Credential Helper에 저장

### 1단계: Personal Access Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **"Generate new token (classic)"** 클릭
3. 설정:
   - **Note**: "MacBook Git"
   - **Expiration**: 원하는 기간
   - **Scopes**: `repo` 체크
4. **"Generate token"** 클릭
5. **토큰 복사** (한 번만 보여줌!)

### 2단계: Credential Helper 설정

```bash
git config --global credential.helper osxkeychain
```

### 3단계: 한 번 푸시 (토큰 입력)

```bash
cd /Users/simonjeb/github/problems
git push https://github.com/SimonBae5664/problems.git main
```

- Username: `SimonBae5664`
- Password: **복사한 토큰** (비밀번호가 아님!)

이후부터는 자동으로 저장된 토큰을 사용합니다.

---

## 방법 4: GitHub Desktop 계속 사용

가장 간단한 방법입니다. 앞으로도 계속 GitHub Desktop을 사용하면 됩니다.

### 사용법

1. GitHub Desktop 앱 열기
2. 변경사항 확인
3. 왼쪽 하단에 커밋 메시지 입력
4. **"Commit to main"** 클릭
5. **"Push origin"** 클릭

---

## 추천 순서

1. **SSH 키 설정** (방법 1) - 한 번 설정하면 계속 편리함
2. **GitHub Desktop** (방법 4) - GUI를 선호하는 경우
3. **GitHub CLI** (방법 2) - 개발자 친화적
4. **Personal Access Token** (방법 3) - 다른 방법이 안 될 때

---

## 현재 상태 확인

```bash
# 원격 URL 확인
git remote -v

# 현재 인증 방식 확인
git config --get credential.helper
```

---

## 문제 해결

### SSH 연결 테스트

```bash
ssh -T git@github.com
```

`Hi SimonBae5664! You've successfully authenticated...` 메시지가 나오면 성공!

### Credential 초기화

```bash
git credential-osxkeychain erase
host=github.com
protocol=https
```

(엔터 두 번)

### 원격 URL 재설정

```bash
# HTTPS로 변경
git remote set-url origin https://github.com/SimonBae5664/problems.git

# SSH로 변경
git remote set-url origin git@github.com:SimonBae5664/problems.git
```

