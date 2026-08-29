import { Router } from 'express';
import { VaultController } from '../controllers/vault.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', VaultController.getVaultItems);
router.post('/', VaultController.createVaultItem);
router.post('/batch', VaultController.createBatchVaultItems);
router.delete('/:itemId', VaultController.deleteVaultItem);

export default router;
