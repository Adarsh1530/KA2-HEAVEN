import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/telemetry', AdminController.getTelemetry);
router.get('/calls', AdminController.getAllCalls);
router.get('/chats', AdminController.getAllChats);
router.get('/memories', AdminController.getAllMemories);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/devices', AdminController.getAllDevices);
router.delete('/devices/:deviceId', AdminController.revokeDevice);

// Data Maintenance & Backups
router.post('/clear-data', AdminController.clearData);
router.get('/backup/export', AdminController.exportBackup);
router.post('/backup/restore', AdminController.restoreBackup);
router.get('/backup/config', AdminController.getBackupConfig);
router.put('/backup/config', AdminController.updateBackupConfig);

export default router;
