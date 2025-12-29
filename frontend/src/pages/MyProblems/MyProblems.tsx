import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problem.service';
import { Problem } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import './MyProblems.css';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '검수 대기',
  UNDER_REVIEW: '검수 중',
  APPROVED: '승인됨',
  REJECTED: '거부됨',
};

export default function MyProblems() {
  const { isAuthenticated } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      loadProblems();
    }
  }, [isAuthenticated, page]);

  const loadProblems = async () => {
    try {
      const data = await problemService.getMyProblems({ page, limit: 20 });
      setProblems(data.problems);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="my-problems">
        <div className="error">로그인이 필요합니다.</div>
      </div>
    );
  }

  return (
    <div className="my-problems">
      <h1>내가 제출한 문제</h1>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : problems.length === 0 ? (
        <div className="empty">
          <p>제출한 문제가 없습니다.</p>
          <Link to="/submit" className="btn-submit">문제 제출하기</Link>
        </div>
      ) : (
        <>
          <div className="problem-list">
            {problems.map((problem) => (
              <div key={problem.id} className="problem-item">
                <div className="problem-info">
                  <Link to={`/problems/${problem.id}`}>
                    <h3>{problem.title}</h3>
                  </Link>
                  <p className="problem-meta">
                    <span className="status">{STATUS_LABELS[problem.status] || problem.status}</span>
                    <span>{new Date(problem.createdAt).toLocaleDateString()}</span>
                  </p>
                  {problem.rejectionReason && (
                    <p className="rejection-reason">거부 사유: {problem.rejectionReason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              이전
            </button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

