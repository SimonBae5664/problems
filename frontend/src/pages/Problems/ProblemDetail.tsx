import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemService } from '../../services/problem.service';
import { commentService } from '../../services/comment.service';
import { Problem, Comment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import CommentSection from '../../components/CommentSection';
import './ProblemDetail.css';

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadProblem();
    }
  }, [id]);

  const loadProblem = async () => {
    try {
      const data = await problemService.getProblemById(id!);
      setProblem(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error || !problem) {
    return <div className="error">{error || '문제를 찾을 수 없습니다.'}</div>;
  }

  return (
    <div className="problem-detail">
      <Link to="/problems" className="back-link">← 목록으로</Link>
      
      <div className="problem-header">
        <h1>{problem.title}</h1>
        <div className="problem-meta">
          <span className="subject">{problem.subject}</span>
          {problem.difficulty && <span className="difficulty">{problem.difficulty}</span>}
          <span className="author">작성자: {problem.submittedBy?.name}</span>
        </div>
      </div>

      {problem.description && (
        <div className="problem-description">
          <p>{problem.description}</p>
        </div>
      )}

      <div className="problem-pdf">
        <iframe
          src={problem.pdfUrl}
          title={problem.title}
          style={{ width: '100%', height: '800px', border: 'none' }}
        />
      </div>

      <CommentSection problemId={problem.id} />
    </div>
  );
}

