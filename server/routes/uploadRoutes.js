import { Router } from 'express';
import multer from 'multer';
import {
  bulkWinners,
  bulkParticipation,
  bulkBonus,
  bulkAttendance,
  downloadTemplate,
} from '../controllers/uploadController.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

// Keep files in memory; we parse the buffer with xlsx and never persist to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.use(auth, roleCheck('admin'));

router.post('/winners', upload.single('file'), bulkWinners);
router.post('/participation', upload.single('file'), bulkParticipation);
router.post('/bonus', upload.single('file'), bulkBonus);
router.post('/attendance', upload.single('file'), bulkAttendance);

router.get('/template/:type', downloadTemplate);

export default router;
