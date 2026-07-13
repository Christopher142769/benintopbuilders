export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok(res, data = null, message = 'OK', status = 200, pagination) {
  const body = { success: true, data, message };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

export function created(res, data, message = 'Créé') {
  return ok(res, data, message, 201);
}

export function fail(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}
