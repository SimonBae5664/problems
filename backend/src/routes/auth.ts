import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { registerValidator, loginValidator } from '../middleware/validators';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

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
        const prisma = (await import('../utils/prisma')).default;
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

// Google OAuth Strategy
if (process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await AuthService.findOrCreateOAuthUser(
            'google',
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName || profile.name?.givenName || 'User'
          );
          return done(null, result);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Kakao OAuth Strategy
if (process.env.OAUTH_KAKAO_CLIENT_ID) {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.OAUTH_KAKAO_CLIENT_ID,
        callbackURL: process.env.OAUTH_KAKAO_CALLBACK_URL || 'http://localhost:5000/api/auth/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile._json?.kakao_account?.email || `${profile.id}@kakao.com`;
          const nickname = profile._json?.properties?.nickname || profile.username || 'User';
          const result = await AuthService.findOrCreateOAuthUser(
            'kakao',
            profile.id.toString(),
            email,
            nickname
          );
          return done(null, result);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);

// OAuth routes - 환경 변수가 있을 때만 등록
if (process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req: any, res) => {
      // Redirect to frontend with token
      const token = req.user.token;
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
  );
} else {
  // 환경 변수가 없을 때 더 나은 에러 메시지
  router.get('/google', (req, res) => {
    res.status(503).json({ error: 'Google OAuth is not configured. Please set OAUTH_GOOGLE_CLIENT_ID and OAUTH_GOOGLE_CLIENT_SECRET in .env file' });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ error: 'Google OAuth is not configured' });
  });
}

if (process.env.OAUTH_KAKAO_CLIENT_ID) {
  router.get(
    '/kakao',
    passport.authenticate('kakao')
  );

  router.get(
    '/kakao/callback',
    passport.authenticate('kakao', { session: false }),
    (req: any, res) => {
      // Redirect to frontend with token
      const token = req.user.token;
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
  );
} else {
  router.get('/kakao', (req, res) => {
    res.status(503).json({ error: 'Kakao OAuth is not configured. Please set OAUTH_KAKAO_CLIENT_ID in .env file' });
  });
  router.get('/kakao/callback', (req, res) => {
    res.status(503).json({ error: 'Kakao OAuth is not configured' });
  });
}

export default router;

