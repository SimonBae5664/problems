import { useState, useEffect } from 'react';
import { problemService } from '../../services/problem.service';
import { Problem } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadProblems();
    }
  }, [user, page]);

  const loadProblems = async () => {
    try {
      const data = await problemService.getPendingProblems({ page, limit: 20 });
      setProblems(data.problems);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (problemId: string) => {
    setActionLoading(problemId);
    try {
      await problemService.approveProblem(problemId);
      loadProblems();
    } catch (error) {
      console.error('Failed to approve problem:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (problemId: string) => {
    if (!rejectionReason.trim()) {
      alert('거부 사유를 입력하세요.');
      return;
    }

    setActionLoading(problemId);
    try {
      await problemService.rejectProblem(problemId, rejectionReason);
      setRejectionReason('');
      setSelectedProblem(null);
      loadProblems();
    } catch (error) {
      console.error('Failed to reject problem:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartReview = async (problemId: string) => {
    setActionLoading(problemId);
    try {
      await problemService.startReview(problemId);
      loadProblems();
    } catch (error) {
      console.error('Failed to start review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="admin-dashboard">
        <div className="error">운영진만 접근 가능합니다.</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>운영진 대시보드</h1>
      <p className="subtitle">검수 대기 중인 문제 목록</p>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : problems.length === 0 ? (
        <div className="empty">검수 대기 중인 문제가 없습니다.</div>
      ) : (
        <>
          <div className="problem-list">
            {problems.map((problem) => (
              <div key={problem.id} className="problem-item">
                <div className="problem-info">
                  <h3>{problem.title}</h3>
                  <p className="problem-meta">
                    <span>과목: {problem.subject}</span>
                    <span>작성자: {problem.submittedBy?.username}</span>
                    <span>상태: {problem.status}</span>
                  </p>
                  {problem.description && (
                    <p className="problem-description">{problem.description}</p>
                  )}
                </div>
                <div className="problem-actions">
                  <a
                    href={problem.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view"
                  >
                    PDF 보기
                  </a>
                  {problem.status === 'PENDING' && (
                    <button
                      onClick={() => handleStartReview(problem.id)}
                      disabled={actionLoading === problem.id}
                      className="btn-review"
                    >
                      검수 시작
                    </button>
                  )}
                  {problem.status === 'UNDER_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleApprove(problem.id)}
                        disabled={actionLoading === problem.id}
                        className="btn-approve"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => setSelectedProblem(problem)}
                        disabled={actionLoading === problem.id}
                        className="btn-reject"
                      >
                        거부
                      </button>
                    </>
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

      {selectedProblem && (
        <div className="modal-overlay" onClick={() => setSelectedProblem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>문제 거부</h2>
            <p>거부 사유를 입력하세요:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
              placeholder="거부 사유를 입력하세요..."
            />
            <div className="modal-actions">
              <button
                onClick={() => handleReject(selectedProblem.id)}
                disabled={!rejectionReason.trim() || actionLoading === selectedProblem.id}
                className="btn-confirm"
              >
                거부
              </button>
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setRejectionReason('');
                }}
                className="btn-cancel"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

