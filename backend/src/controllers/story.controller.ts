import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class StoryController {
  public static async getTimeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const timeline = [...data.timelineMilestones].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      res.json({ timeline });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch timeline.' });
    }
  }

  public static async addMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, date, category = 'milestone', icon = 'heart', mediaUrl } = req.body;

      if (!title || !date) {
        res.status(400).json({ error: 'Title and date are required.' });
        return;
      }

      const data = db.getData();
      const newMilestone = {
        id: uuidv4(),
        title: title.trim(),
        description: description || '',
        date,
        monthYear: new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        category,
        icon,
        mediaUrl,
        createdAt: new Date().toISOString(),
      };

      data.timelineMilestones.unshift(newMilestone);
      await db.persist();

      res.status(201).json({ milestone: newMilestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add timeline milestone.' });
    }
  }
}
