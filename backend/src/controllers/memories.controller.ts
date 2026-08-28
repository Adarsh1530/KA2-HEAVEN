import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class MemoriesController {
  public static async getMemories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category, favorite } = req.query;
      const data = db.getData();
      let memories = [...data.memories];

      if (category && category !== 'all') {
        memories = memories.filter(m => m.category === category);
      }

      if (favorite === 'true') {
        memories = memories.filter(m => m.isFavorite);
      }

      memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ memories });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch memories.' });
    }
  }

  public static async createMemory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, date, location, category = 'photos', mediaUrl, thumbnailUrl, mediaType = 'image', notes } = req.body;

      if (!title || !mediaUrl) {
        res.status(400).json({ error: 'Title and media are required.' });
        return;
      }

      const data = db.getData();
      const newMemory = {
        id: uuidv4(),
        title: title.trim(),
        description: description || '',
        date: date || new Date().toISOString().split('T')[0],
        location: location || '',
        category,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || mediaUrl,
        mediaType,
        isFavorite: false,
        notes: notes || '',
        createdBy: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.memories.unshift(newMemory);

      // Auto-add to timeline milestones
      data.timelineMilestones.unshift({
        id: uuidv4(),
        title: newMemory.title,
        description: newMemory.description || 'A cherished memory in our heaven.',
        date: newMemory.date,
        monthYear: new Date(newMemory.date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        category: 'milestone',
        icon: 'camera',
        mediaUrl: newMemory.mediaUrl,
        relatedMemoryId: newMemory.id,
        createdAt: new Date().toISOString(),
      });

      await db.persist();
      res.status(201).json({ memory: newMemory });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create memory.' });
    }
  }

  public static async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { memoryId } = req.params;
      const data = db.getData();
      const memory = data.memories.find(m => m.id === memoryId);

      if (!memory) {
        res.status(404).json({ error: 'Memory not found.' });
        return;
      }

      memory.isFavorite = !memory.isFavorite;
      memory.updatedAt = new Date().toISOString();
      await db.persist();

      res.json({ memory });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle favorite.' });
    }
  }

  public static async deleteMemory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { memoryId } = req.params;
      const data = db.getData();

      data.memories = data.memories.filter(m => m.id !== memoryId);
      data.timelineMilestones = data.timelineMilestones.filter(t => t.relatedMemoryId !== memoryId);

      await db.persist();
      res.json({ success: true, memoryId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete memory.' });
    }
  }
}
