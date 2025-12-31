import { useState, useEffect } from 'react';
import { commentService } from '../services/comment.service';
import { Comment } from '../types';
import { useAuth } from '../hooks/useAuth';
import './CommentSection.css';

interface CommentSectionProps {
  problemId: string;
}

export default function CommentSection({ problemId }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'MOST_LIKED'>('NEWEST');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [problemId, sortOrder]);

  const loadComments = async () => {
    try {
      const data = await commentService.getComments(problemId, {
        sortOrder,
        includeReplies: true,
      });
      setComments(data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentService.createComment({
        content: newComment,
        problemId,
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await commentService.createComment({
        content: replyContent,
        problemId,
        parentId,
      });
      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleToggleLike = async (commentId: string, isLike: boolean) => {
    try {
      await commentService.toggleLike(commentId, isLike);
      loadComments();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h2>댓글 ({comments.length})</h2>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
          <option value="NEWEST">최신순</option>
          <option value="OLDEST">오래된순</option>
          <option value="MOST_LIKED">좋아요순</option>
        </select>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={4}
            required
          />
          <button type="submit">댓글 작성</button>
        </form>
      )}

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : comments.length === 0 ? (
        <div className="empty">댓글이 없습니다.</div>
      ) : (
        <div className="comments">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={() => setReplyingTo(comment.id)}
              onToggleLike={handleToggleLike}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={() => handleSubmitReply(comment.id)}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: () => void;
  onToggleLike: (commentId: string, isLike: boolean) => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
}

function CommentItem({
  comment,
  onReply,
  onToggleLike,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.author.username}</span>
        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="comment-content">{comment.content}</div>
      <div className="comment-actions">
        <button onClick={() => onToggleLike(comment.id, true)}>
          👍 {comment.likeCount}
        </button>
        <button onClick={() => onToggleLike(comment.id, false)}>
          👎 {comment.dislikeCount}
        </button>
        {isAuthenticated && (
          <button onClick={onReply}>답글</button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            placeholder="답글을 입력하세요..."
            rows={3}
          />
          <div className="reply-actions">
            <button onClick={onSubmitReply}>작성</button>
            <button onClick={onCancelReply}>취소</button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <span className="reply-author">{reply.author.username}</span>
                <span className="reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="reply-content">{reply.content}</div>
              <div className="reply-actions">
                <button onClick={() => onToggleLike(reply.id, true)}>
                  👍 {reply.likeCount}
                </button>
                <button onClick={() => onToggleLike(reply.id, false)}>
                  👎 {reply.dislikeCount}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

