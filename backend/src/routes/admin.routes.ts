import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/telemetry', AdminController.getTelemetry);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/devices', AdminController.getAllDevices);
router.delete('/devices/:deviceId', AdminController.revokeDevice);

export default router;
