import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 첫 번째 입력 필드에 자동 포커스
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    // 숫자만 허용
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // 다음 입력 필드로 자동 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 모든 필드가 채워지면 자동 제출
    if (newCode.every((digit) => digit !== '') && index === 5) {
      handleSubmit();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // 백스페이스 키 처리
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      // 마지막 입력 필드에 포커스
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('6자리 인증 코드를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.verifyCode(codeString, email);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '인증 코드가 올바르지 않습니다.');
      // 실패 시 코드 초기화
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) {
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      // 로그인된 사용자인 경우
      const token = authService.getStoredToken();
      if (token) {
        await authService.resendVerificationEmail();
      } else {
        // 로그인되지 않은 경우 - 이메일로 재전송 요청
        await authService.resendVerificationEmailByEmail(email);
      }
      
      setResendCooldown(300); // 5분 = 300초
      setError('');
      alert('인증 코드가 재발송되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.error || '재전송에 실패했습니다.');
      if (err.response?.data?.error?.includes('재전송 제한')) {
        setResendCooldown(300);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 style={{ color: '#4caf50' }}>인증 완료!</h1>
          <p>이메일 인증이 완료되었습니다.</p>
          <p style={{ color: '#888', fontSize: '14px' }}>잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>이메일 인증</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          이메일로 받은 6자리 인증 코드를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">인증 코드</label>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  style={{
                    width: '50px',
                    height: '60px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                  className="code-input"
                />
              ))}
            </div>
            <small style={{ display: 'block', textAlign: 'center', color: '#888' }}>
              코드를 붙여넣을 수 있습니다
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || code.join('').length !== 6} className="btn-primary">
            {loading ? '인증 중...' : '인증하기'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0 || !email}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? '#999' : '#667eea',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
            }}
          >
            {resendLoading
              ? '재전송 중...'
              : resendCooldown > 0
              ? `${formatTime(resendCooldown)} 후 재전송 가능`
              : '인증 코드 재전송'}
          </button>
        </div>

        <p className="auth-link" style={{ marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            로그인 페이지로
          </button>
        </p>
      </div>
    </div>
  );
}
