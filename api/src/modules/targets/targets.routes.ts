import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './targets.controller';

const router = Router();

router.use(authRequired);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;