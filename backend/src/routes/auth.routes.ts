import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', authenticateJWT, AuthController.getMe);
router.put('/profile', authenticateJWT, AuthController.updateProfile);
router.post('/pin/verify', authenticateJWT, AuthController.verifyPin);
router.put('/pin/change', authenticateJWT, AuthController.changePin);
router.get('/sessions', authenticateJWT, AuthController.getSessions);
router.delete('/sessions/:sessionId', authenticateJWT, AuthController.revokeSession);
router.post('/logout', authenticateJWT, AuthController.logout);

export default router;
