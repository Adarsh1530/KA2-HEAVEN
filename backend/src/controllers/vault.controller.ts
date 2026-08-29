import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class VaultController {
  public static async getVaultItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vaultType = 'shared' } = req.query;
      const currentUserId = req.user!.id;
      const data = db.getData();

      let items = data.vaultItems;

      if (vaultType === 'personal') {
        // Strictly only items owned by this current user
        items = items.filter(v => v.vaultType === 'personal' && v.ownerId === currentUserId);
      } else {
        // Shared vault items visible to both
        items = items.filter(v => v.vaultType === 'shared');
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch vault items.' });
    }
  }

  public static async createVaultItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        vaultType = 'shared',
        itemType = 'note',
        encryptedData,
        iv,
        authTag = '',
        fileUrl,
        fileSize,
        mimeType,
      } = req.body;

      if (!encryptedData || !iv) {
        res.status(400).json({ error: 'Encrypted payload and IV are required.' });
        return;
      }

      const defaultTitle = `Secret ${itemType === 'photo' ? 'Photo' : itemType === 'video' ? 'Video' : 'Note'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      const resolvedTitle = (title && title.trim()) ? title.trim() : defaultTitle;

      const data = db.getData();
      const newItem = {
        id: uuidv4(),
        ownerId: req.user!.id,
        vaultType,
        title: resolvedTitle,
        itemType,
        encryptedData,
        iv,
        authTag,
        fileUrl,
        fileSize,
        mimeType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.vaultItems.unshift(newItem);
      await db.persist();

      res.status(201).json({ item: newItem });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save vault item.' });
    }
  }

  public static async createBatchVaultItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items array is required.' });
        return;
      }

      const data = db.getData();
      const createdItems: any[] = [];
      const now = new Date().toISOString();

      for (const item of items) {
        if (!item.encryptedData || !item.iv) continue;

        const itemType = item.itemType || 'photo';
        const defaultTitle = `Secret ${itemType === 'photo' ? 'Photo' : itemType === 'video' ? 'Video' : 'Note'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        const resolvedTitle = (item.title && item.title.trim()) ? item.title.trim() : defaultTitle;

        const newItem = {
          id: uuidv4(),
          ownerId: req.user!.id,
          vaultType: item.vaultType || 'shared',
          title: resolvedTitle,
          itemType,
          encryptedData: item.encryptedData,
          iv: item.iv,
          authTag: item.authTag || '',
          fileUrl: item.fileUrl,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          createdAt: now,
          updatedAt: now,
        };

        data.vaultItems.unshift(newItem);
        createdItems.push(newItem);
      }

      await db.persist();
      res.status(201).json({ items: createdItems, success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create batch vault items.' });
    }
  }

  public static async deleteVaultItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const currentUserId = req.user!.id;
      const data = db.getData();

      const item = data.vaultItems.find(v => v.id === itemId);
      if (!item) {
        res.status(404).json({ error: 'Vault item not found.' });
        return;
      }

      // Check ownership for personal vault or shared vault items
      if (item.vaultType === 'personal' && item.ownerId !== currentUserId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Permission denied.' });
        return;
      }

      data.vaultItems = data.vaultItems.filter(v => v.id !== itemId);
      await db.persist();

      res.json({ success: true, itemId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete vault item.' });
    }
  }
}
