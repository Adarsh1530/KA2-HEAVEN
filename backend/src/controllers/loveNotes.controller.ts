import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class LoveNotesController {
  public static async getLoveNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const notes = [...data.loveNotes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const populated = notes.map(n => {
        const sender = data.users.find(u => u.id === n.senderId);
        return {
          ...n,
          senderName: sender?.name || 'My Love',
        };
      });

      res.json({ loveNotes: populated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch love notes.' });
    }
  }

  public static async sendLoveNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, message, stationeryStyle = 'romantic_parchment', photoUrl, date } = req.body;
      const currentUserId = req.user!.id;
      const data = db.getData();

      const partner = data.users.find(u => u.id !== currentUserId);
      if (!partner) {
        res.status(400).json({ error: 'Partner not found.' });
        return;
      }

      if (!title || !message) {
        res.status(400).json({ error: 'Title and message are required.' });
        return;
      }

      const newNote = {
        id: uuidv4(),
        senderId: currentUserId,
        receiverId: partner.id,
        title: title.trim(),
        message: message.trim(),
        stationeryStyle,
        photoUrl,
        date: date || new Date().toISOString().split('T')[0],
        isOpened: false,
        createdAt: new Date().toISOString(),
      };

      data.loveNotes.unshift(newNote);

      // Add to story timeline
      data.timelineMilestones.unshift({
        id: uuidv4(),
        title: `Love Note: ${newNote.title}`,
        description: `${req.user!.nickname || req.user!.name} sent a heartfelt love note.`,
        date: newNote.date,
        monthYear: new Date(newNote.date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        category: 'note',
        icon: 'mail',
        relatedLoveNoteId: newNote.id,
        createdAt: new Date().toISOString(),
      });

      await db.persist();

      res.status(201).json({
        loveNote: {
          ...newNote,
          senderName: req.user!.name,
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send love note.' });
    }
  }

  public static async openLoveNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const data = db.getData();

      const note = data.loveNotes.find(n => n.id === noteId);
      if (!note) {
        res.status(404).json({ error: 'Love note not found.' });
        return;
      }

      if (!note.isOpened && note.receiverId === req.user?.id) {
        note.isOpened = true;
        note.openedAt = new Date().toISOString();
        await db.persist();
      }

      const sender = data.users.find(u => u.id === note.senderId);
      res.json({
        loveNote: {
          ...note,
          senderName: sender?.name || 'My Love',
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to open love note.' });
    }
  }
}
