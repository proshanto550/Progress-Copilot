import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './projects.controller';

const router = Router();

router.get('/github', authRequired, controller.getGitHubData);
router.post('/github/connect', authRequired, controller.connectGitHub);

export default router;
