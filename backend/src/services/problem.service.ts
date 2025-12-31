import { prisma } from '../utils/prisma';
import { VerificationService } from './verification.service';
import { ProblemStatus, Subject, Difficulty, Prisma } from '@prisma/client';

export interface CreateProblemData {
  title: string;
  description?: string;
  subject: Subject;
  difficulty?: Difficulty;
  pdfUrl: string;
  submittedById: string;
}

export class ProblemService {
  /**
   * 문제 제출
   */
  static async createProblem(data: CreateProblemData) {
    // 사용자가 인증되었는지 확인 (선택사항 - 필요시 주석 해제)
    // const isVerified = await VerificationService.isUserVerified(data.submittedById);
    // if (!isVerified) {
    //   throw new Error('User must be verified to submit problems');
    // }

    // 문제 생성
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        subject: data.subject,
        difficulty: data.difficulty,
        pdfUrl: data.pdfUrl,
        status: ProblemStatus.PENDING,
        submittedById: data.submittedById,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          } as Prisma.UserSelect,
        },
      },
    });

    // 제출 기록 생성
    await prisma.problemSubmission.create({
      data: {
        problemId: problem.id,
        submittedById: data.submittedById,
        status: ProblemStatus.PENDING,
      },
    });

    return problem;
  }

  /**
   * 문제 목록 조회 (공개된 문제만)
   */
  static async getPublishedProblems(
    page: number = 1,
    limit: number = 20,
    subject?: Subject,
    difficulty?: Difficulty
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProblemStatus.APPROVED,
    };

    if (subject) {
      where.subject = subject;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: {
            select: {
              id: true,
              username: true,
              name: true,
            } as Prisma.UserSelect,
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.problem.count({ where }),
    ]);

    return {
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 문제 상세 조회
   */
  static async getProblemById(id: string, includeUnpublished: boolean = false) {
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          } as Prisma.UserSelect,
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          } as Prisma.UserSelect,
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    // 공개되지 않은 문제는 작성자나 운영진만 볼 수 있음
    if (problem.status !== ProblemStatus.APPROVED && !includeUnpublished) {
      throw new Error('Problem not found or not published');
    }

    return problem;
  }

  /**
   * 내가 제출한 문제 목록
   */
  static async getMyProblems(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: { submittedById: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.problem.count({ where: { submittedById: userId } }),
    ]);

    return {
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 운영진: 대기 중인 문제 목록
   */
  static async getPendingProblems(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: {
          status: {
            in: [ProblemStatus.PENDING, ProblemStatus.UNDER_REVIEW],
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          submittedBy: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            } as Prisma.UserSelect,
          },
        },
      }),
      prisma.problem.count({
        where: {
          status: {
            in: [ProblemStatus.PENDING, ProblemStatus.UNDER_REVIEW],
          },
        },
      }),
    ]);

    return {
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 운영진: 문제 승인
   */
  static async approveProblem(problemId: string, adminId: string) {
    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: {
        status: ProblemStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          } as Prisma.UserSelect,
        },
      },
    });

    // 제출 기록도 업데이트
    await prisma.problemSubmission.updateMany({
      where: { problemId },
      data: { status: ProblemStatus.APPROVED },
    });

    return problem;
  }

  /**
   * 운영진: 문제 거부
   */
  static async rejectProblem(
    problemId: string,
    adminId: string,
    reason: string
  ) {
    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: {
        status: ProblemStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          } as Prisma.UserSelect,
        },
      },
    });

    // 제출 기록도 업데이트
    await prisma.problemSubmission.updateMany({
      where: { problemId },
      data: { status: ProblemStatus.REJECTED },
    });

    return problem;
  }

  /**
   * 운영진: 검수 시작
   */
  static async startReview(problemId: string, adminId: string) {
    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: {
        status: ProblemStatus.UNDER_REVIEW,
        reviewedById: adminId,
      },
    });

    return problem;
  }
}

