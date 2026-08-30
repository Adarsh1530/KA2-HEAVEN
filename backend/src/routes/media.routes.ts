import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { upload } from '../middleware/upload';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

// Upload Single Media File
router.post('/upload', authenticateJWT, upload.single('file'), (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded or invalid file type.' });
      return;
    }

    const host = req.get('host') || `localhost:${config.port}`;
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(201).json({
      fileUrl,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// Upload Multiple Media Files
router.post('/upload-multiple', authenticateJWT, upload.array('files', 20), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const host = req.get('host') || `localhost:${config.port}`;
    const protocol = req.protocol || 'http';

    const uploaded = files.map(file => ({
      fileUrl: `${protocol}://${host}/uploads/${file.filename}`,
      fileName: file.originalname,
      storedName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    res.status(201).json({ files: uploaded });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Multiple file upload failed.' });
  }
});

// Authenticated / Secure Media Stream
router.get('/file/:filename', (req: Request, res: Response): void => {
  const { filename } = req.params;
  const sanitized = path.basename(filename);
  const filePath = path.join(config.storage.uploadDir, sanitized);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  res.sendFile(filePath);
});

export default router;
