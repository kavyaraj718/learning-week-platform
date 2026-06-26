import { Router } from 'express';
import { liveStats } from '../controllers/statsController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/live', auth, liveStats);

export default router;
