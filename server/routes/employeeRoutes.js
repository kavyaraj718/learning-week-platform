import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  getDashboard,
  getPointsHistory,
} from '../controllers/employeeController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.get('/:id/dashboard', getDashboard);
router.get('/:id/points-history', getPointsHistory);

export default router;
