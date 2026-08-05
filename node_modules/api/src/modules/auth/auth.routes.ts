import { Router } from 'express';
import * as controller from './auth.controller';
import { authRequired } from '../../middlewares/auth';

const router = Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', authRequired, controller.me);

export default router;