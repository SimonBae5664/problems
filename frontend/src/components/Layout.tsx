import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            수능 문제 공유
          </Link>
          <nav className="nav">
            <Link to="/problems">문제 목록</Link>
            {isAuthenticated && (
              <>
                <Link to="/submit">문제 제출</Link>
                <Link to="/my-problems">내 문제</Link>
                <Link to="/files">내 파일</Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin">운영진</Link>
                )}
              </>
            )}
          </nav>
          <div className="user-section">
            {isAuthenticated ? (
              <>
                <span className="user-name">{user?.name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">로그인</Link>
                <Link to="/register" className="btn-register">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

