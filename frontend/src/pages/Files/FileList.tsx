import { useState, useEffect } from 'react';
import { fileService } from '../../services/file.service';
import { File } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { JobStatus } from '../../components/JobStatus';
import './FileList.css';

export default function FileList() {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fileService.listFiles();
      setFiles(data.files);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      setError(err.message || '파일 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('정말 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await fileService.deleteFile(fileId);
      await loadFiles();
    } catch (err: any) {
      alert('파일 삭제에 실패했습니다: ' + err.message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getVisibilityLabel = (visibility: string): string => {
    switch (visibility) {
      case 'PRIVATE':
        return '비공개';
      case 'SHARED':
        return '공유';
      case 'PUBLIC':
        return '공개';
      default:
        return visibility;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="file-list">
        <div className="error">로그인이 필요합니다.</div>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h1>내 파일</h1>
        <button onClick={loadFiles} className="btn-refresh">
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : files.length === 0 ? (
        <div className="empty">
          <p>업로드한 파일이 없습니다.</p>
        </div>
      ) : (
        <div className="files-grid">
          {files.map((file) => {
            const latestJob = file.processingJobs?.[0];
            return (
              <div key={file.id} className="file-item">
                <div className="file-header">
                  <h3 className="file-name">{file.originalFilename}</h3>
                  <span className={`visibility-badge visibility-${file.visibility.toLowerCase()}`}>
                    {getVisibilityLabel(file.visibility)}
                  </span>
                </div>

                <div className="file-info">
                  <div className="info-row">
                    <span className="info-label">크기:</span>
                    <span className="info-value">{formatFileSize(file.size)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">타입:</span>
                    <span className="info-value">{file.mimeType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">업로드:</span>
                    <span className="info-value">
                      {new Date(file.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>

                {latestJob && (
                  <div className="file-job-status">
                    <JobStatus job={latestJob} showDetails={false} />
                  </div>
                )}

                <div className="file-actions">
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="btn-delete"
                    disabled={latestJob?.status === 'PROCESSING'}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

