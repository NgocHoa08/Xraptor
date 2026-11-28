import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class LocalFileStorage {
  constructor({ isVercel = false } = {}) {
    this.isVercel = isVercel;
    this.uploadsDir = isVercel
      ? '/tmp/xraptor-uploads'
      : path.resolve(__dirname, '../../../public/uploads');
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async uploadImage(file) {
    if (this.isVercel) {
      return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    const ext = path.extname(file.originalname || '.webp').toLowerCase() || '.webp';
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    fs.writeFileSync(path.join(this.uploadsDir, safe), file.buffer);
    return `/uploads/${safe}`;
  }
}
