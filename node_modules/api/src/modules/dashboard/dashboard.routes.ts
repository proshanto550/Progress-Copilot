import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './dashboard.controller';

const router = Router();

// Both dashboard endpoints are private — they aggregate user-scoped data.
router.use(authRequired);

router.get('/', controller.dashboard);
router.get('/progress', controller.progress);

export default router;
