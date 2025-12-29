import prisma from '../utils/prisma';

type CommentSortOrder = 'NEWEST' | 'OLDEST' | 'MOST_LIKED';

export interface CreateCommentData {
  content: string;
  problemId: string;
  authorId: string;
  parentId?: string;
}

export class CommentService {
  /**
   * 댓글 작성
   */
  static async createComment(data: CreateCommentData) {
    // 문제가 존재하는지 확인
    const problem = await prisma.problem.findUnique({
      where: { id: data.problemId },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    // 문제가 공개되었는지 확인
    if (problem.status !== 'APPROVED') {
      throw new Error('Cannot comment on unpublished problem');
    }

    // 대댓글인 경우 부모 댓글 확인
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new Error('Parent comment not found');
      }

      if (parent.problemId !== data.problemId) {
        throw new Error('Parent comment does not belong to this problem');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        problemId: data.problemId,
        authorId: data.authorId,
        parentId: data.parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * 댓글 수정
   */
  static async updateComment(commentId: string, userId: string, content: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Not authorized to edit this comment');
    }

    if (comment.deletedAt) {
      throw new Error('Cannot edit deleted comment');
    }

    // 수정 이력 저장
    await prisma.commentEditHistory.create({
      data: {
        commentId: comment.id,
        content: comment.content,
      },
    });

    // 댓글 업데이트
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });

    return updatedComment;
  }

  /**
   * 댓글 삭제 (소프트 삭제)
   */
  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    if (comment.deletedAt) {
      throw new Error('Comment already deleted');
    }

    const deletedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return deletedComment;
  }

  /**
   * 댓글 목록 조회
   */
  static async getComments(
    problemId: string,
    page: number = 1,
    limit: number = 50,
    sortOrder: CommentSortOrder = CommentSortOrder.NEWEST,
    includeReplies: boolean = true
  ) {
    const skip = (page - 1) * limit;

    // 정렬 옵션
    let orderBy: any = {};
    switch (sortOrder) {
      case CommentSortOrder.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case CommentSortOrder.OLDEST:
        orderBy = { createdAt: 'asc' };
        break;
      case CommentSortOrder.MOST_LIKED:
        orderBy = { likeCount: 'desc' };
        break;
    }

    // 최상위 댓글만 조회 (parentId가 null)
    const where: any = {
      problemId,
      parentId: null,
      deletedAt: null,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
          ...(includeReplies && {
            replies: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                  },
                },
              },
            },
          }),
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 댓글 좋아요/싫어요
   */
  static async toggleLike(commentId: string, userId: string, isLike: boolean) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // 기존 좋아요/싫어요 확인
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 이미 좋아요/싫어요가 있는 경우
      if (existingLike.isLike === isLike) {
        // 같은 타입이면 취소
        await prisma.commentLike.delete({
          where: {
            commentId_userId: {
              commentId,
              userId,
            },
          },
        });

        // 카운트 업데이트
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            likeCount: isLike ? Math.max(0, comment.likeCount - 1) : comment.likeCount,
            dislikeCount: !isLike ? Math.max(0, comment.dislikeCount - 1) : comment.dislikeCount,
          },
        });
      } else {
        // 다른 타입이면 변경
        await prisma.commentLike.update({
          where: {
            commentId_userId: {
              commentId,
              userId,
            },
          },
          data: { isLike },
        });

        // 카운트 업데이트
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            likeCount: isLike ? comment.likeCount + 1 : Math.max(0, comment.likeCount - 1),
            dislikeCount: !isLike ? comment.dislikeCount + 1 : Math.max(0, comment.dislikeCount - 1),
          },
        });
      }
    } else {
      // 새로운 좋아요/싫어요
      await prisma.commentLike.create({
        data: {
          commentId,
          userId,
          isLike,
        },
      });

      // 카운트 업데이트
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likeCount: isLike ? comment.likeCount + 1 : comment.likeCount,
          dislikeCount: !isLike ? comment.dislikeCount + 1 : comment.dislikeCount,
        },
      });
    }

    // 업데이트된 댓글 반환
    return await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });
  }

  /**
   * 댓글 수정 이력 조회
   */
  static async getEditHistory(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // 작성자만 이력 조회 가능
    if (comment.authorId !== userId) {
      throw new Error('Not authorized to view edit history');
    }

    const history = await prisma.commentEditHistory.findMany({
      where: { commentId },
      orderBy: { editedAt: 'desc' },
    });

    return history;
  }
}

