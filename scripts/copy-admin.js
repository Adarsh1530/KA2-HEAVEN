import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const adminDist = path.join(rootDir, 'admin', 'dist');
const mobileDistAdmin = path.join(rootDir, 'mobile', 'dist', 'admin');

try {
  if (fs.existsSync(adminDist)) {
    console.log('[Build] Copying admin dist into mobile/dist/admin for unified Vercel deployment...');
    fs.mkdirSync(mobileDistAdmin, { recursive: true });
    fs.cpSync(adminDist, mobileDistAdmin, { recursive: true });
    console.log('[Build] Successfully copied admin portal into mobile/dist/admin.');
  } else {
    console.warn('[Build Warning] admin/dist does not exist. Skipping admin copy.');
  }
} catch (err) {
  console.error('[Build Error] Failed to copy admin dist:', err);
}
