import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import {
  getProfileV2,
  updateProfileV2,
  changePassword,
  updateAvatar,
} from './profile.v2.controller';

const router = Router();

/**
 * Phase 7 — Structured profile (split layout)
 *
 *   GET   /profile-v2            full payload + completion%
 *   PUT   /profile-v2            partial update by section
 *   PATCH /profile-v2/password
 *   PATCH /profile-v2/avatar
 *
 * Kept separate from `/api/user/profile` (the AI personalization
 * endpoint) so the two schemas can evolve independently.
 */
router.get('/profile-v2', authRequired, getProfileV2);
router.put('/profile-v2', authRequired, updateProfileV2);
router.patch('/profile-v2/password', authRequired, changePassword);
router.patch('/profile-v2/avatar', authRequired, updateAvatar);

export default router;
