import { Router } from 'express';
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  enroll,
} from '../controllers/activityController.js';
import {
  listRegistrations,
  toggleAttendance,
  assignWinners,
} from '../controllers/registrationController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(auth);

router.get('/', listActivities);
router.post('/', roleCheck('admin'), createActivity);

router.get('/:id', getActivity);
router.put('/:id', roleCheck('admin'), updateActivity);
router.delete('/:id', roleCheck('admin'), deleteActivity);

router.post('/:id/enroll', enroll);

router.get('/:id/registrations', roleCheck('admin'), listRegistrations);
router.patch('/:id/attendance', roleCheck('admin'), toggleAttendance);
router.post('/:id/winners', roleCheck('admin'), assignWinners);

export default router;
