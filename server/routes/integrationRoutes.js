import { Router } from 'express';
import { syncNow, status } from '../controllers/integrationController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(auth);

router.get('/social/status', status);
router.post('/social/sync', roleCheck('admin'), syncNow);

export default router;
