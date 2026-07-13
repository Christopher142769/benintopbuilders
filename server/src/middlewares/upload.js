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

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
    return cb(new AppError('Format image non supporté', { status: 400, code: 'INVALID_FILE' }));
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});
