import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../../services/problem.service';
import { Problem } from '../../types';
import './ProblemList.css';

const SUBJECTS = [
  { value: '', label: '전체' },
  { value: 'KOREAN', label: '국어' },
  { value: 'MATH', label: '수학' },
  { value: 'ENGLISH', label: '영어' },
  { value: 'KOREAN_HISTORY', label: '한국사' },
  { value: 'SOCIAL_STUDIES', label: '사회' },
  { value: 'SCIENCE', label: '과학' },
  { value: 'SECOND_LANGUAGE', label: '제2외국어' },
];

const DIFFICULTIES = [
  { value: '', label: '전체' },
  { value: 'EASY', label: '쉬움' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HARD', label: '어려움' },
];

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    loadProblems();
  }, [page, subject, difficulty]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await problemService.getProblems({
        page,
        limit: 20,
        subject: subject || undefined,
        difficulty: difficulty || undefined,
      });
      setProblems(data.problems);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="problem-list">
      <h1>문제 목록</h1>

      <div className="filters">
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }}>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : problems.length === 0 ? (
        <div className="empty">문제가 없습니다.</div>
      ) : (
        <>
          <div className="problem-grid">
            {problems.map((problem) => (
              <Link key={problem.id} to={`/problems/${problem.id}`} className="problem-card">
                <h3>{problem.title}</h3>
                <p className="problem-meta">
                  <span className="subject">{SUBJECTS.find(s => s.value === problem.subject)?.label || problem.subject}</span>
                  {problem.difficulty && (
                    <span className="difficulty">{DIFFICULTIES.find(d => d.value === problem.difficulty)?.label}</span>
                  )}
                </p>
                {problem.description && <p className="problem-description">{problem.description}</p>}
                <div className="problem-footer">
                  <span>{problem.submittedBy?.username}</span>
                  <span>{problem._count?.comments || 0} 댓글</span>
                </div>
              </Link>
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

