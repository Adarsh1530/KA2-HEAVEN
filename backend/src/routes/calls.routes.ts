import { Router } from 'express';
import { CallsController } from '../controllers/calls.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/history', CallsController.getCallHistory);
router.post('/log', CallsController.logCall);

export default router;
