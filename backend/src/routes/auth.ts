import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { registerValidator, loginValidator } from '../middleware/validators';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../utils/prisma';

const router = Router();

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    },
    async (payload, done) => {
      try {
        // 싱글톤 prisma 인스턴스 사용 (동적 import 불필요)
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/verify-code', AuthController.verifyCode);
router.post('/resend-verification', authenticateToken, AuthController.resendVerificationEmail);
router.post('/resend-verification-by-email', AuthController.resendVerificationEmailByEmail);

export default router;

