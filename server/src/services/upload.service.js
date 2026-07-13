import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { randomToken } from '../utils/crypto.js';
import { uploadsRoot } from '../middlewares/upload.js';

function extFromUpload(file) {
  const original = (file.originalname || '').toLowerCase();
  if (original.endsWith('.docx')) return 'docx';
  if (original.endsWith('.doc')) return 'doc';
  if (original.endsWith('.pdf') || file.mimetype === 'application/pdf') return 'pdf';
  if (file.mimetype === 'application/msword') return 'doc';
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  return 'bin';
}

export async function saveDocument(file, { folder, filenamePrefix = 'doc' }) {
  const ext = extFromUpload(file);
  const name = `${filenamePrefix}-${Date.now()}-${randomToken(4)}.${ext}`;
  const abs = path.join(uploadsRoot, folder, name);
  await fs.writeFile(abs, file.buffer);
  return {
    url: `/uploads/${folder}/${name}`,
    nomOriginal: file.originalname,
  };
}

export async function saveResizedImage(buffer, { folder, maxSize, filenamePrefix = 'img', mimetype }) {
  if (mimetype === 'application/pdf') {
    const name = `${filenamePrefix}-${Date.now()}-${randomToken(4)}.pdf`;
    const abs = path.join(uploadsRoot, folder, name);
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
