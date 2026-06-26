import { Router } from 'express';
import { participation, engagement, team, trends } from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

// Leadership analytics are admin-only.
router.use(auth, roleCheck('admin'));

router.get('/participation', participation);
router.get('/engagement', engagement);
router.get('/team', team);
router.get('/trends', trends);

export default router;
