import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './tasks.controller';

const router = Router();

// All task endpoints require an authenticated user — the service layer
// relies on `req.user.id` being present to scope every Prisma call.
router.use(authRequired);

// Sub-tasks of a specific target — useful for the "View Progress" panel.
router.get('/by-target/:targetId', controller.listByTarget);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
// Dedicated toggle endpoint so the points/streak pipeline has a single
// home. Title/description/deadline edits flow through PATCH /:id.
router.patch('/:id/toggle', controller.toggle);
router.delete('/:id', controller.remove);

export default router;