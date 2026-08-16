import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './settings.controller';

const router = Router();

router.use(authRequired);

router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);
router.post('/github/disconnect', controller.disconnectGitHub);

export default router;
