import { Router } from 'express';
import { getRecognition } from '../controllers/recognitionController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getRecognition);

export default router;
