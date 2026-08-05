import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './futureGoal.controller';

const router = Router();

router.use(authRequired);

// `me` is the only Future Goal a user has, so the URL doesn't need an id.
router.get('/me', controller.get);
router.put('/me', controller.put);

export default router;