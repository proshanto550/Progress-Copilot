import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './reminders.controller';

const router = Router();

router.get('/', authRequired, controller.getReminders);
router.post('/', authRequired, controller.createReminder);
router.delete('/:id', authRequired, controller.deleteReminder);

export default router;
