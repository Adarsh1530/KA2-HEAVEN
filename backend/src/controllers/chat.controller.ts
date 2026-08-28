import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class ChatController {
  public static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, limit = '50', before } = req.query;
      const data = db.getData();
      const currentUserId = req.user?.id;

      let messages = data.messages.filter(m => !m.isDeleted);

      if (search) {
        const query = String(search).toLowerCase();
        messages = messages.filter(m => m.content.toLowerCase().includes(query));
      }

      if (before) {
        messages = messages.filter(m => new Date(m.createdAt) < new Date(String(before)));
      }

      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const maxLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
      const sliced = messages.slice(-maxLimit);

      // Populate reactions and replyTo metadata
      const populated = sliced.map(m => {
        const reactions = data.reactions.filter(r => r.messageId === m.id);
        let replyTo = undefined;
        if (m.replyToId) {
          const original = data.messages.find(orig => orig.id === m.replyToId);
          if (original) {
            replyTo = {
              id: original.id,
              senderId: original.senderId,
              content: original.content,
              type: original.type,
            };
          }
        }
        return {
          ...m,
          reactions,
          replyTo,
        };
      });

      // Mark incoming messages as read
      let hasUpdates = false;
      data.messages.forEach(m => {
        if (m.receiverId === currentUserId && m.status !== 'read') {
          m.status = 'read';
          hasUpdates = true;
        }
      });
      if (hasUpdates) {
        db.persist().catch(console.error);
      }

      res.json({ messages: populated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { content, type = 'text', mediaUrl, thumbnailUrl, mediaMeta, voiceMeta, replyToId } = req.body;
      const currentUserId = req.user!.id;
      const data = db.getData();

      // Find partner id
      const partner = data.users.find(u => u.id !== currentUserId);
      if (!partner) {
        res.status(400).json({ error: 'Partner not found.' });
        return;
      }

      const newMessage = {
        id: uuidv4(),
        senderId: currentUserId,
        receiverId: partner.id,
        content: content || '',
        type,
        mediaUrl,
        thumbnailUrl,
        mediaMeta,
        voiceMeta,
        replyToId,
        isEdited: false,
        isDeleted: false,
        status: partner.presenceStatus === 'online' ? ('delivered' as const) : ('sent' as const),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.messages.push(newMessage);
      await db.persist();

      let replyTo = undefined;
      if (replyToId) {
        const orig = data.messages.find(m => m.id === replyToId);
        if (orig) {
          replyTo = {
            id: orig.id,
            senderId: orig.senderId,
            content: orig.content,
            type: orig.type,
          };
        }
      }

      res.status(201).json({
        message: {
          ...newMessage,
          reactions: [],
          replyTo,
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send message.' });
    }
  }

  public static async editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const data = db.getData();

      const message = data.messages.find(m => m.id === messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found.' });
        return;
      }

      if (message.senderId !== req.user?.id) {
        res.status(403).json({ error: 'Cannot edit partner message.' });
        return;
      }

      message.content = content;
      message.isEdited = true;
      message.updatedAt = new Date().toISOString();

      await db.persist();
      res.json({ message });
    } catch (err) {
      res.status(500).json({ error: 'Failed to edit message.' });
    }
  }

  public static async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const data = db.getData();

      const message = data.messages.find(m => m.id === messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found.' });
        return;
      }

      if (message.senderId !== req.user?.id && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Permission denied.' });
        return;
      }

      message.isDeleted = true;
      message.content = 'This message was deleted';
      message.mediaUrl = undefined;
      message.updatedAt = new Date().toISOString();

      await db.persist();
      res.json({ success: true, messageId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete message.' });
    }
  }

  public static async reactToMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const currentUserId = req.user!.id;
      const data = db.getData();

      // Check if already reacted with this emoji -> toggle off
      const existingIndex = data.reactions.findIndex(
        r => r.messageId === messageId && r.userId === currentUserId && r.emoji === emoji
      );

      if (existingIndex !== -1) {
        data.reactions.splice(existingIndex, 1);
      } else {
        // Remove existing reaction by this user on this message and add new emoji
        data.reactions = data.reactions.filter(
          r => !(r.messageId === messageId && r.userId === currentUserId)
        );
        data.reactions.push({
          id: uuidv4(),
          messageId,
          userId: currentUserId,
          emoji,
          createdAt: new Date().toISOString(),
        });
      }

      await db.persist();

      const updatedReactions = data.reactions.filter(r => r.messageId === messageId);
      res.json({ messageId, reactions: updatedReactions });
    } catch (err) {
      res.status(500).json({ error: 'Failed to react to message.' });
    }
  }

  public static async markRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user!.id;
      const data = db.getData();

      data.messages.forEach(m => {
        if (m.receiverId === currentUserId && m.status !== 'read') {
          m.status = 'read';
        }
      });

      await db.persist();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to mark read.' });
    }
  }
}
