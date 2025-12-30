import React from 'react';
import { ProcessingJob } from '../types';
import './JobStatus.css';

interface JobStatusProps {
  job: ProcessingJob;
  showDetails?: boolean;
}

export function JobStatus({ job, showDetails = false }: JobStatusProps) {
  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'QUEUED':
        return 'status-queued';
      case 'PROCESSING':
        return 'status-processing';
      case 'SUCCEEDED':
        return 'status-succeeded';
      case 'FAILED':
        return 'status-failed';
      default:
        return '';
    }
  };

  const getStatusText = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'QUEUED':
        return '대기 중';
      case 'PROCESSING':
        return '처리 중';
      case 'SUCCEEDED':
        return '완료';
      case 'FAILED':
        return '실패';
      default:
        return status;
    }
  };

  const getJobTypeText = (jobType: ProcessingJob['jobType']) => {
    switch (jobType) {
      case 'EXTRACT':
        return '텍스트 추출';
      case 'OCR':
        return 'OCR 처리';
      case 'CLASSIFY':
        return '분류';
      case 'EMBED':
        return '임베딩 생성';
      case 'SUMMARIZE':
        return '요약';
      case 'STUDENT_RECORD_ANALYZE':
        return '생기부 분석';
      default:
        return jobType;
    }
  };

  return (
    <div className={`job-status ${getStatusColor(job.status)}`}>
      <div className="job-status-header">
        <span className="job-type">{getJobTypeText(job.jobType)}</span>
        <span className={`status-badge ${getStatusColor(job.status)}`}>
          {getStatusText(job.status)}
        </span>
      </div>

      {showDetails && (
        <div className="job-status-details">
          {job.startedAt && (
            <div className="detail-item">
              <span className="detail-label">시작 시간:</span>
              <span className="detail-value">
                {new Date(job.startedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}

          {job.finishedAt && (
            <div className="detail-item">
              <span className="detail-label">완료 시간:</span>
              <span className="detail-value">
                {new Date(job.finishedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          )}

          {job.error && (
            <div className="detail-item error">
              <span className="detail-label">오류:</span>
              <span className="detail-value">{job.error}</span>
            </div>
          )}

          {job.outputs && job.outputs.length > 0 && (
            <div className="detail-item">
              <span className="detail-label">결과물:</span>
              <span className="detail-value">{job.outputs.length}개</span>
            </div>
          )}
        </div>
      )}

      {(job.status === 'QUEUED' || job.status === 'PROCESSING') && (
        <div className="job-status-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width:
                  job.status === 'PROCESSING' ? '50%' : job.status === 'QUEUED' ? '10%' : '100%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

