import sharp from 'sharp';
import path from 'path';
import { randomToken } from '../utils/crypto.js';
import { uploadsRoot } from '../middlewares/upload.js';

export async function saveResizedImage(buffer, { folder, maxSize, filenamePrefix = 'img' }) {
  const name = `${filenamePrefix}-${Date.now()}-${randomToken(4)}.webp`;
  const rel = path.join(folder, name);
  const abs = path.join(uploadsRoot, rel);
  await sharp(buffer)
    .rotate()
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(abs);
  return `/uploads/${folder}/${name}`;
}
