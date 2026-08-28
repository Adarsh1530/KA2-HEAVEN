import { Router } from 'express';
import { LoveNotesController } from '../controllers/loveNotes.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', LoveNotesController.getLoveNotes);
router.post('/', LoveNotesController.sendLoveNote);
router.put('/:noteId/open', LoveNotesController.openLoveNote);

export default router;
