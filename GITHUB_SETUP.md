# GitHub Repository 연동 가이드

## 1. GitHub에서 새 Repository 생성

1. https://github.com 접속 및 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository**
3. Repository 정보 입력:
   - Repository name: `problems-community` (원하는 이름)
   - Description: "수능 문제 공유 커뮤니티 웹 서비스"
   - Public 또는 Private 선택
   - **Initialize this repository with a README** 체크 해제 (이미 README가 있음)
4. **Create repository** 클릭

## 2. 로컬 저장소와 연결

GitHub에서 생성한 repository의 URL을 복사한 후 다음 명령어 실행:

### HTTPS 사용 시:
```bash
cd /Users/simonjeb/github/problems
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### SSH 사용 시:
```bash
cd /Users/simonjeb/github/problems
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

**중요**: `YOUR_USERNAME`과 `YOUR_REPO_NAME`을 실제 값으로 변경하세요!

## 3. 인증

### HTTPS 사용 시:
- GitHub Personal Access Token 필요
- 토큰 생성: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
- 권한: `repo` 체크
- 푸시 시 토큰을 비밀번호로 입력

### SSH 사용 시:
- SSH 키가 GitHub에 등록되어 있어야 함
- SSH 키 확인: `cat ~/.ssh/id_rsa.pub`
- 없으면 생성: `ssh-keygen -t ed25519 -C "your_email@example.com"`
- GitHub Settings > SSH and GPG keys에 공개키 추가

## 4. 확인

GitHub repository 페이지에서 파일들이 업로드되었는지 확인하세요.

## 5. 향후 작업

### 변경사항 푸시:
```bash
git add .
git commit -m "변경사항 설명"
git push
```

### 다른 컴퓨터에서 클론:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 브랜치 생성 및 작업:
```bash
git checkout -b feature/new-feature
# 작업 후
git add .
git commit -m "새 기능 추가"
git push origin feature/new-feature
```

