import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, '../../', env.uploadDir);

fs.mkdirSync(path.join(uploadsRoot, 'logos'), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'references'), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'dossiers'), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'ao'), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'produits'), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, 'rccm'), { recursive: true });

const storage = multer.memoryStorage();

const DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function imageOrPdfFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) || file.mimetype === 'application/pdf') {
    return cb(null, true);
  }
  return cb(new AppError('Format non supporté (image ou PDF)', { status: 400, code: 'INVALID_FILE' }));
}

function documentFilter(_req, file, cb) {
  const ok =
    DOC_MIMES.has(file.mimetype) ||
    /\.(pdf|doc|docx)$/i.test(file.originalname || '');
  if (ok) return cb(null, true);
  return cb(
    new AppError('RCCM : fichier PDF, DOC ou DOCX uniquement', {
      status: 400,
      code: 'INVALID_FILE',
    })
  );
}

export const uploadImage = multer({
  storage,
  fileFilter: imageOrPdfFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: Math.max(env.maxUploadMb, 10) * 1024 * 1024 },
});
