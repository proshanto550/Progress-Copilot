import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './notes.controller';

const router = Router();

router.get('/', authRequired, controller.getNotes);
router.post('/', authRequired, controller.createNote);
router.put('/:id', authRequired, controller.updateNote);
router.delete('/:id', authRequired, controller.deleteNote);

export default router;
