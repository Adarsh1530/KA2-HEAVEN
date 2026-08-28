import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class CallsController {
  public static async getCallHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const calls = [...data.calls].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const populated = calls.map(c => {
        const caller = data.users.find(u => u.id === c.callerId);
        const receiver = data.users.find(u => u.id === c.receiverId);
        return {
          ...c,
          callerName: caller?.name || 'Unknown',
          callerAvatar: caller?.avatarUrl || '',
          receiverName: receiver?.name || 'Unknown',
          receiverAvatar: receiver?.avatarUrl || '',
        };
      });

      res.json({ calls: populated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch call history.' });
    }
  }

  public static async logCall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        receiverId,
        callType = 'voice',
        status = 'completed',
        durationSeconds = 0,
        startedAt,
        endedAt,
        recordingUrl,
        isRecorded = false,
      } = req.body;

      const data = db.getData();
      const newCall = {
        id: uuidv4(),
        callerId: req.user!.id,
        receiverId,
        callType,
        status,
        startedAt: startedAt || new Date().toISOString(),
        endedAt: endedAt || new Date().toISOString(),
        durationSeconds,
        recordingUrl,
        isRecorded,
        createdAt: new Date().toISOString(),
      };

      data.calls.unshift(newCall);
      await db.persist();

      res.status(201).json({ call: newCall });
    } catch (err) {
      res.status(500).json({ error: 'Failed to log call.' });
    }
  }
}
