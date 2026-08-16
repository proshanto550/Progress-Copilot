import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './futureGoal.controller';

const router = Router();

router.use(authRequired);

router.get('/', controller.get);
router.get('/me', controller.get);
router.put('/', controller.put);
router.put('/me', controller.put);
router.post('/', controller.put);
router.post('/me', controller.put);

export default router;