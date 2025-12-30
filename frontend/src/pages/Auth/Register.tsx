import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      console.log('회원가입 시도:', { email, name });
      await register(email, password, name);
      setSuccess(true);
      // 이메일 인증 코드 입력 페이지로 리다이렉트
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      console.error('회원가입 에러:', err);
      console.error('에러 응답:', err.response);
      console.error('에러 요청 URL:', err.config?.url);
      
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (err.response) {
        // 서버에서 반환한 에러
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못함 (네트워크 에러)
        if (err.message?.includes('hostname') || err.message?.includes('could not be found')) {
          errorMessage = '서버를 찾을 수 없습니다. API URL 설정을 확인해주세요.';
        } else {
          errorMessage = '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
        }
      } else {
        // 요청 설정 중 에러
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <small>최소 8자, 대문자, 소문자, 숫자 포함</small>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '5px', 
              marginBottom: '15px',
              color: '#2e7d32'
            }}>
              <strong>회원가입이 완료되었습니다!</strong>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                이메일로 인증 코드를 발송했습니다. 이메일을 확인하여 인증을 완료해주세요.
                <br />
                잠시 후 인증 페이지로 이동합니다...
              </p>
            </div>
          )}
          <button type="submit" disabled={loading || success} className="btn-primary">
            {loading ? '가입 중...' : success ? '가입 완료' : '회원가입'}
          </button>
        </form>

        {!success && (
          <p className="auth-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        )}
      </div>
    </div>
  );
}

