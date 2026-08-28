import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { config } from '../config/env';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/svg+xml',
    // Audio / Voice messages
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    'audio/mp4',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Documents
    'application/pdf',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxFileSizeMB * 1024 * 1024,
  },
});
