import { Router } from 'express';
import { giveBonus, getConfig, updateConfig } from '../controllers/pointsController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(auth);

router.get('/config', getConfig);
router.put('/config', roleCheck('admin'), updateConfig);
router.post('/bonus', roleCheck('admin'), giveBonus);

export default router;
