import { AppError } from '../../../domain/errors/AppError.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Multer file upload errors
  if (err?.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ảnh tải lên vượt quá dung lượng cho phép (tối đa 5MB).'
        : err.message;
    return res.status(400).json({ error: msg, code: 'UPLOAD_ERROR' });
  }

  console.error('[API Error]', err);
  res.status(err?.statusCode || 500).json({
    error: err?.message || 'Đã có lỗi xảy ra trên máy chủ.',
    code: 'INTERNAL_ERROR',
  });
}
