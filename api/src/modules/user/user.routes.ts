import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import { me as authMe } from '../auth/auth.controller';
import { updateMe } from './user.controller';
import { getProfile, updateProfile } from './profile.controller';
import { exportUserData, deleteAccount } from '../settings/settings.controller';

const router = Router();

router.get('/me', authRequired, authMe);
router.patch('/me', authRequired, updateMe);

router.get('/profile', authRequired, getProfile);
router.put('/profile', authRequired, updateProfile);

router.get('/export', authRequired, exportUserData);
router.delete('/account', authRequired, deleteAccount);

export default router;
