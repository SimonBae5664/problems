# 이메일 인증 설정 가이드

이 애플리케이션은 회원가입 시 이메일 인증을 통해 사용자의 이메일 주소를 확인합니다.

## 동작 방식

1. **회원가입**: 사용자가 회원가입을 하면 이메일 인증 링크가 포함된 이메일이 발송됩니다.
2. **이메일 인증**: 사용자가 이메일의 링크를 클릭하면 이메일 인증이 완료됩니다.
3. **로그인**: 이메일 인증이 완료된 사용자만 로그인할 수 있습니다.

## 환경 변수 설정

`backend/.env` 파일에 다음 환경 변수를 추가하세요:

```env
# 이메일 발송 설정
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# 애플리케이션 설정
APP_NAME=Problems Community
FRONTEND_URL=http://localhost:3000
```

### Gmail 사용 시

1. Google 계정 설정에서 **2단계 인증** 활성화
2. **앱 비밀번호** 생성:
   - Google 계정 > 보안 > 2단계 인증 > 앱 비밀번호
   - 앱 선택: "메일"
   - 기기 선택: "기타(맞춤 이름)" > "Problems Community" 입력
   - 생성된 16자리 비밀번호를 `EMAIL_PASSWORD`에 사용

### 다른 이메일 서비스 사용 시

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

## 데이터베이스 마이그레이션

스키마 변경사항을 적용하려면 마이그레이션을 실행하세요:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

마이그레이션 이름을 물어보면 `add_email_verification` 입력

## API 엔드포인트

### 이메일 인증 확인
```
GET /api/auth/verify-email?token={verification_token}
```

### 인증 이메일 재발송
```
POST /api/auth/resend-verification
Authorization: Bearer {jwt_token}
```

## 프론트엔드 구현

### 이메일 인증 페이지 생성

`frontend/src/pages/Auth/VerifyEmail.tsx` 파일을 생성하여 이메일 인증을 처리하세요:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('인증 토큰이 없습니다.');
      return;
    }

    // 이메일 인증 확인
    authService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('이메일 인증이 완료되었습니다. 로그인해주세요.');
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.error || '이메일 인증에 실패했습니다.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'loading' && <p>이메일 인증 중...</p>}
        {status === 'success' && (
          <div>
            <h2>인증 완료!</h2>
            <p>{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h2>인증 실패</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/login')}>로그인 페이지로</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 라우트 추가

`frontend/src/App.tsx`에 라우트 추가:

```tsx
import VerifyEmail from './pages/Auth/VerifyEmail';

// ...
<Route path="/verify-email" element={<VerifyEmail />} />
```

### API 서비스에 메서드 추가

`frontend/src/services/auth.service.ts`에 다음 메서드 추가:

```tsx
async verifyEmail(token: string) {
  const response = await api.get('/auth/verify-email', {
    params: { token }
  });
  return response.data;
}

async resendVerificationEmail() {
  const response = await api.post('/auth/resend-verification');
  return response.data;
}
```

## 테스트

1. 회원가입을 진행하면 이메일이 발송됩니다.
2. 이메일의 링크를 클릭하면 이메일 인증이 완료됩니다.
3. 이메일 인증 전에는 로그인이 불가능합니다.
4. 로그인 후 `/api/auth/resend-verification` 엔드포인트를 호출하면 인증 이메일을 재발송할 수 있습니다.

## 문제 해결

### 이메일이 발송되지 않는 경우

1. 환경 변수가 올바르게 설정되었는지 확인
2. Gmail 사용 시 앱 비밀번호를 사용했는지 확인
3. 이메일 서비스의 SMTP 설정 확인
4. 백엔드 로그에서 에러 메시지 확인

### 인증 토큰이 만료된 경우

- 토큰은 24시간 후 만료됩니다.
- 로그인 후 재발송 엔드포인트를 사용하여 새 인증 이메일을 요청하세요.

