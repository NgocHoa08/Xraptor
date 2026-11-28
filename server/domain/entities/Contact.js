import { ValidationError } from '../errors/AppError.js';

export const CONTACT_STATUSES = Object.freeze(['Chưa xử lý', 'Đã xử lý']);

export function validateCreateContactInput(body = {}) {
  const { fullName, phone, email, orderCode, subject, message } = body;
  if (!fullName || !phone || !subject || !message) {
    throw new ValidationError('Vui lòng điền đầy đủ thông tin bắt buộc.');
  }
  return {
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    email: String(email || '').trim(),
    orderCode: String(orderCode || '').trim(),
    subject: String(subject).trim(),
    message: String(message).trim(),
  };
}

export function assertValidContactStatus(status) {
  if (!CONTACT_STATUSES.includes(status)) {
    throw new ValidationError('Trạng thái không hợp lệ.');
  }
}

export function validateSubscriberEmail(email) {
  const cleaned = String(email || '').trim().toLowerCase();
  if (!cleaned || !cleaned.includes('@')) {
    throw new ValidationError('Email không hợp lệ.');
  }
  return cleaned;
}
