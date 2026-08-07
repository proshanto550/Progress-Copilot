import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { me as authMe } from '../auth/auth.controller';
import { updateMe } from './user.controller';
import { getProfile, updateProfile } from './profile.controller';

const router = Router();

// Canonical /me for the private layout — same payload as /api/auth/me but
// lives under /api/user so the frontend doesn't have to know about the auth
// module's internals.
router.get('/me', authRequired, authMe);
router.patch('/me', authRequired, updateMe);

// Personalization profile (Phase 6+) — used by Edith's prompt builder.
router.get('/profile', authRequired, getProfile);
router.put('/profile', authRequired, updateProfile);

export default router;
