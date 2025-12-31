import rateLimit from 'express-rate-limit';

// 회원가입/로그인용 rate limiter (IP 기준)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  // IP 추출 (프록시 뒤에서 실행 시)
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
      : req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  },
});

