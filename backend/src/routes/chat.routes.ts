import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/messages', ChatController.getMessages);
router.post('/messages', ChatController.sendMessage);
router.put('/messages/:messageId', ChatController.editMessage);
router.delete('/messages/:messageId', ChatController.deleteMessage);
router.post('/messages/:messageId/react', ChatController.reactToMessage);
router.post('/read', ChatController.markRead);

export default router;
