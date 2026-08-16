import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './courses.controller';

const router = Router();

router.get('/', authRequired, controller.getCourses);
router.post('/', authRequired, controller.createCourse);
router.put('/:id', authRequired, controller.updateCourse);
router.delete('/:id', authRequired, controller.deleteCourse);

export default router;
