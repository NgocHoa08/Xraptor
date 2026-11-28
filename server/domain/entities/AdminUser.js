import { ValidationError } from '../errors/AppError.js';
import { getPermissionsForRole, isValidRole, ROLE_DEFINITIONS } from '../rbac/permissions.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAdminUser(row, { includePasswordHash = false } = {}) {
  if (!row) return null;
  const role = isValidRole(row.role) ? row.role : 'staff';
  const isActive = row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active);
  const user = {
    id: Number(row.id),
    email: row.email,
    name: row.name,
    role,
    roleLabel: ROLE_DEFINITIONS[role]?.label || role,
    isActive,
    permissions: getPermissionsForRole(role),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
  if (includePasswordHash) {
    user.passwordHash = row.password_hash;
  }
  return user;
}

export function validateCreateAdminInput({ email, name, password, role = 'staff', isActive = true } = {}) {
  const cleanedEmail = String(email || '').trim().toLowerCase();
  const cleanedName = String(name || '').trim();
  const rawPassword = String(password || '');

  if (!cleanedEmail || !EMAIL_RE.test(cleanedEmail)) {
    throw new ValidationError('Email nhân sự không hợp lệ.');
  }
  if (!cleanedName || cleanedName.length < 2) {
    throw new ValidationError('Họ tên nhân sự phải có ít nhất 2 ký tự.');
  }
  if (rawPassword.length < 6) {
    throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự.');
  }
  if (!isValidRole(role)) {
    throw new ValidationError('Vai trò phân quyền không hợp lệ.');
  }

  return {
    email: cleanedEmail,
    name: cleanedName,
    password: rawPassword,
    role,
    isActive: Boolean(isActive),
  };
}

export function validateUpdateAdminInput({ name, role, isActive, password } = {}) {
  const patch = {};

  if (name !== undefined) {
    const cleanedName = String(name || '').trim();
    if (cleanedName.length < 2) {
      throw new ValidationError('Họ tên nhân sự phải có ít nhất 2 ký tự.');
    }
    patch.name = cleanedName;
  }

  if (role !== undefined) {
    if (!isValidRole(role)) {
      throw new ValidationError('Vai trò phân quyền không hợp lệ.');
    }
    patch.role = role;
  }

  if (isActive !== undefined) {
    patch.isActive = Boolean(isActive);
  }

  if (password !== undefined && String(password).length > 0) {
    if (String(password).length < 6) {
      throw new ValidationError('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }
    patch.password = String(password);
  }

  return patch;
}

export function validatePasswordChange({ currentPassword, newPassword } = {}) {
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    throw new ValidationError('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }
  return {
    currentPassword: String(currentPassword),
    newPassword: String(newPassword),
  };
}
