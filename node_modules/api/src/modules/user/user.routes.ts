import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { me as authMe } from '../auth/auth.controller';
import { updateMe } from './user.controller';

const router = Router();

// Canonical /me for the private layout — same payload as /api/auth/me but
// lives under /api/user so the frontend doesn't have to know about the auth
// module's internals.
router.get('/me', authRequired, authMe);
router.patch('/me', authRequired, updateMe);

export default router;
