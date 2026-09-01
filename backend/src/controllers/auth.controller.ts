import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, deviceName, deviceType } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const data = db.getData();
      const user = data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Generate Tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiresIn as any }
      );

      const refreshToken = jwt.sign(
        { id: user.id, sessionId: uuidv4() },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn as any }
      );

      // Register or update device session
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Client';
      const sessionId = uuidv4();

      data.devices.push({
        id: sessionId,
        userId: user.id,
        deviceName: deviceName || 'KA² Device',
        deviceType: deviceType || 'web',
        ipAddress,
        userAgent,
        isActive: true,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Update user presence and last active
      user.presenceStatus = 'online';
      user.lastActive = new Date().toISOString();

      // Add audit log
      data.auditLogs.unshift({
        id: uuidv4(),
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        details: `Successful login from ${deviceName || 'Unknown'} (${deviceType || 'web'})`,
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString(),
      });

      await db.persist();

      // Return user profile and tokens
      const { passwordHash, pinHash, ...safeUser } = user;
      res.json({
        user: safeUser,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 mins
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required.' });
        return;
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
      const data = db.getData();
      const user = data.users.find(u => u.id === decoded.id);

      if (!user) {
        res.status(401).json({ error: 'Invalid refresh token.' });
        return;
      }

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiresIn as any }
      );

      res.json({
        accessToken: newAccessToken,
        expiresIn: 900,
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
  }

  public static async verifyPin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { pin } = req.body;
      if (!pin) {
        res.status(400).json({ error: 'PIN is required.' });
        return;
      }

      const data = db.getData();
      const user = data.users.find(u => u.id === req.user?.id);

      if (!user || !user.pinHash) {
        res.status(400).json({ error: 'User or PIN configuration not found.' });
        return;
      }

      const isValid = await bcrypt.compare(pin.toString(), user.pinHash);
      if (!isValid) {
        res.status(403).json({ error: 'Incorrect security PIN.' });
        return;
      }

      res.json({ success: true, verified: true });
    } catch (err) {
      res.status(500).json({ error: 'Error verifying PIN.' });
    }
  }

  public static async changePin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { currentPin, newPin } = req.body;
      if (!newPin || newPin.toString().length < 4) {
        res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
        return;
      }

      const data = db.getData();
      const user = data.users.find(u => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (user.pinHash && currentPin) {
        const isValid = await bcrypt.compare(currentPin.toString(), user.pinHash);
        if (!isValid) {
          res.status(403).json({ error: 'Current PIN is incorrect.' });
          return;
        }
      }

      user.pinHash = await bcrypt.hash(newPin.toString(), 10);
      user.updatedAt = new Date().toISOString();
      await db.persist();

      res.json({ success: true, message: 'PIN updated successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Error updating PIN.' });
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const user = data.users.find(u => u.id === req.user?.id);
      const partner = data.users.find(u => u.id !== req.user?.id);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const { passwordHash: p1, pinHash: pin1, ...safeUser } = user;
      const safePartner = partner ? {
        id: partner.id,
        name: partner.name,
        nickname: partner.nickname,
        avatarUrl: partner.avatarUrl,
        bio: partner.bio,
        presenceStatus: partner.presenceStatus,
        lastActive: partner.lastActive,
      } : null;

      res.json({
        user: safeUser,
        partner: safePartner,
        appSettings: data.appSettings,
      });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching profile.' });
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, nickname, bio, avatarUrl } = req.body;
      const data = db.getData();
      const user = data.users.find(u => u.id === req.user?.id);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (name) user.name = name.trim();
      if (nickname) user.nickname = nickname.trim();
      if (bio !== undefined) user.bio = bio.trim();
      if (avatarUrl) user.avatarUrl = avatarUrl;
      user.updatedAt = new Date().toISOString();

      await db.persist();
      const { passwordHash, pinHash, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (err) {
      res.status(500).json({ error: 'Error updating profile.' });
    }
  }

  public static async updatePartnerNickname(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { nickname } = req.body;
      if (!nickname || !nickname.trim()) {
        res.status(400).json({ error: 'Partner nickname cannot be empty.' });
        return;
      }

      const data = db.getData();
      const partner = data.users.find(u => u.id !== req.user?.id);

      if (!partner) {
        res.status(404).json({ error: 'Partner profile not found.' });
        return;
      }

      partner.nickname = nickname.trim();
      partner.updatedAt = new Date().toISOString();

      await db.persist();

      const safePartner = {
        id: partner.id,
        name: partner.name,
        nickname: partner.nickname,
        avatarUrl: partner.avatarUrl,
        bio: partner.bio,
        presenceStatus: partner.presenceStatus,
        lastActive: partner.lastActive,
      };

      res.json({
        partner: safePartner,
        message: 'Partner nickname updated successfully.'
      });
    } catch (err) {
      res.status(500).json({ error: 'Error updating partner nickname.' });
    }
  }

  public static async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const sessions = data.devices.filter(d => d.userId === req.user?.id);
      res.json({ sessions });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching sessions.' });
    }
  }

  public static async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const data = db.getData();
      data.devices = data.devices.filter(d => d.id !== sessionId || d.userId !== req.user?.id);
      await db.persist();
      res.json({ success: true, message: 'Session revoked.' });
    } catch (err) {
      res.status(500).json({ error: 'Error revoking session.' });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = db.getData();
      const user = data.users.find(u => u.id === req.user?.id);
      if (user) {
        user.presenceStatus = 'offline';
        user.lastActive = new Date().toISOString();
      }
      await db.persist();
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Error logging out.' });
    }
  }
}
