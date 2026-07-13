import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomToken } from '../utils/crypto.js';
import { uploadsRoot } from '../middlewares/upload.js';

export async function saveResizedImage(buffer, { folder, maxSize, filenamePrefix = 'img', mimetype }) {
  if (mimetype === 'application/pdf') {
    const name = `${filenamePrefix}-${Date.now()}-${randomToken(4)}.pdf`;
    const rel = path.join(folder, name);
    const abs = path.join(uploadsRoot, rel);
    await fs.writeFile(abs, buffer);
    return `/uploads/${folder}/${name}`;
  }

  const name = `${filenamePrefix}-${Date.now()}-${randomToken(4)}.webp`;
  const abs = path.join(uploadsRoot, folder, name);
  await sharp(buffer)
    .rotate()
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(abs);
  return `/uploads/${folder}/${name}`;
}

