import { Router } from 'express';
import {
  organization,
  team,
  teamDetail,
  department,
  location,
} from '../controllers/leaderboardController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/organization', organization);
router.get('/team', team);
router.get('/team/:manager', teamDetail);
router.get('/department', department);
router.get('/location', location);

export default router;
