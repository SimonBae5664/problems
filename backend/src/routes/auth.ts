import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { registerValidator, loginValidator } from '../middleware/validators';
import { authRateLimiter } from '../middleware/rateLimit';
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

// Routes with rate limiting
router.post('/register', authRateLimiter, registerValidator, AuthController.register);
router.post('/login', authRateLimiter, loginValidator, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;

