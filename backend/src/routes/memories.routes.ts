import { Router } from 'express';
import { MemoriesController } from '../controllers/memories.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', MemoriesController.getMemories);
router.post('/', MemoriesController.createMemory);
router.post('/batch', MemoriesController.createBatchMemories);
router.put('/:memoryId/favorite', MemoriesController.toggleFavorite);
router.delete('/:memoryId', MemoriesController.deleteMemory);

export default router;
