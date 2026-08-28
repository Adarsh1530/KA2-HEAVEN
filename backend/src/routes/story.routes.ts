import { Router } from 'express';
import { StoryController } from '../controllers/story.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/timeline', StoryController.getTimeline);
router.post('/timeline', StoryController.addMilestone);

export default router;
