import prisma from '../utils/prisma';

// SQLite에서는 enum이 String이므로 타입 정의
type VerificationType = 'UNIVERSITY' | 'HIGH_SCHOOL' | 'QUALIFICATION';
type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// 이메일 도메인 패턴 정의
const UNIVERSITY_DOMAINS = [
  /@.*\.ac\.kr$/,
  /@.*\.univ\.ac\.kr$/,
  /@.*\.university\.ac\.kr$/,
];

const HIGH_SCHOOL_DOMAINS = [
  /@.*\.hs\.kr$/,
  /@.*\.go\.kr$/,
];

export class VerificationService {
  /**
   * 이메일 도메인을 기반으로 자동 인증 타입 결정
   */
  static detectVerificationType(email: string): VerificationType | null {
    const domain = email.toLowerCase();

    // 대학 도메인 체크
    for (const pattern of UNIVERSITY_DOMAINS) {
      if (pattern.test(domain)) {
        return 'UNIVERSITY' as VerificationType;
      }
    }

    // 고등학교 도메인 체크
    for (const pattern of HIGH_SCHOOL_DOMAINS) {
      if (pattern.test(domain)) {
        return 'HIGH_SCHOOL' as VerificationType;
      }
    }

    return null;
  }

  /**
   * 이메일에서 도메인 추출
   */
  static extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? `@${parts[1]}` : '';
  }

  /**
   * 사용자 인증 생성 (자동 또는 수동)
   */
  static async createVerification(
    userId: string,
    type: VerificationType,
    emailDomain?: string,
    documentUrl?: string
  ) {
    // 기존 인증이 있는지 확인
    const existing = await prisma.verification.findFirst({
      where: {
        userId,
        type,
        status: {
          in: ['PENDING', 'VERIFIED'] as VerificationStatus[],
        },
      },
    });

    if (existing) {
      throw new Error('Verification already exists');
    }

    // 자동 인증 가능한 경우
    if (emailDomain && (type === VerificationType.UNIVERSITY || type === VerificationType.HIGH_SCHOOL)) {
      const verification = await prisma.verification.create({
        data: {
          userId,
          type,
          emailDomain,
          status: 'VERIFIED' as VerificationStatus,
          verifiedAt: new Date(),
        },
      });
      return verification;
    }

    // 수동 검토 필요한 경우
    const verification = await prisma.verification.create({
      data: {
        userId,
        type,
        emailDomain: emailDomain || null,
        documentUrl: documentUrl || null,
        status: 'PENDING' as VerificationStatus,
      },
    });

    return verification;
  }

  /**
   * 사용자 이메일로 자동 인증 시도
   */
  static async autoVerifyUser(userId: string, email: string) {
    const type = this.detectVerificationType(email);
    
    if (!type) {
      return null; // 자동 인증 불가능
    }

    const emailDomain = this.extractDomain(email);

    try {
      return await this.createVerification(userId, type, emailDomain);
    } catch (error) {
      // 이미 인증이 존재하는 경우 무시
      return null;
    }
  }

  /**
   * 운영진이 인증 승인
   */
  static async approveVerification(verificationId: string, adminId: string) {
    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: 'VERIFIED' as VerificationStatus,
        verifiedAt: new Date(),
      },
    });

    return verification;
  }

  /**
   * 운영진이 인증 거부
   */
  static async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string
  ) {
    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: 'REJECTED' as VerificationStatus,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return verification;
  }

  /**
   * 사용자의 인증 상태 조회
   */
  static async getUserVerifications(userId: string) {
    return await prisma.verification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 사용자가 인증된 사용자인지 확인
   */
  static async isUserVerified(userId: string, type?: VerificationType): Promise<boolean> {
    const where: any = {
      userId,
      status: 'VERIFIED' as VerificationStatus,
    };

    if (type) {
      where.type = type;
    }

    const verification = await prisma.verification.findFirst({ where });
    return !!verification;
  }

  /**
   * 대기 중인 인증 목록 조회 (운영진용)
   */
  static async getPendingVerifications() {
    return await prisma.verification.findMany({
      where: { status: 'PENDING' as VerificationStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

