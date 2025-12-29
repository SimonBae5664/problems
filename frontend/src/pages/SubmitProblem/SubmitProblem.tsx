import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadService } from '../../services/upload.service';
import { problemService } from '../../services/problem.service';
import { useAuth } from '../../hooks/useAuth';
import './SubmitProblem.css';

const SUBJECTS = [
  { value: 'KOREAN', label: '국어' },
  { value: 'MATH', label: '수학' },
  { value: 'ENGLISH', label: '영어' },
  { value: 'KOREAN_HISTORY', label: '한국사' },
  { value: 'SOCIAL_STUDIES', label: '사회' },
  { value: 'SCIENCE', label: '과학' },
  { value: 'SECOND_LANGUAGE', label: '제2외국어' },
];

const DIFFICULTIES = [
  { value: '', label: '선택 안함' },
  { value: 'EASY', label: '쉬움' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HARD', label: '어려움' },
];

export default function SubmitProblem() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="submit-problem">
        <div className="error">로그인이 필요합니다.</div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('PDF 파일만 업로드 가능합니다.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !subject || !file) {
      setError('제목, 과목, PDF 파일은 필수입니다.');
      return;
    }

    try {
      setUploading(true);
      // PDF 업로드
      const uploadResult = await uploadService.uploadPdf(file);
      
      setUploading(false);
      setSubmitting(true);

      // 문제 제출
      await problemService.createProblem({
        title,
        description: description || undefined,
        subject,
        difficulty: difficulty || undefined,
        pdfUrl: uploadResult.url,
      });

      navigate('/my-problems');
    } catch (err: any) {
      setError(err.response?.data?.error || '문제 제출에 실패했습니다.');
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="submit-problem">
      <h1>문제 제출</h1>
      <form onSubmit={handleSubmit} className="submit-form">
        <div className="form-group">
          <label htmlFor="title">제목 *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">설명</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={1000}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subject">과목 *</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">선택하세요</option>
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">난이도</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="file">PDF 파일 *</label>
          <input
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {file && (
            <div className="file-info">
              <span>{file.name}</span>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={uploading || submitting}
          className="btn-submit"
        >
          {uploading ? '업로드 중...' : submitting ? '제출 중...' : '제출하기'}
        </button>
      </form>
    </div>
  );
}

