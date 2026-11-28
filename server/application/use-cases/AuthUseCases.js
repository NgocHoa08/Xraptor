import { validatePasswordChange } from '../../domain/entities/AdminUser.js';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../../domain/errors/AppError.js';
import { listRoleDefinitions, PERMISSION_CATALOG } from '../../domain/rbac/permissions.js';

export class LoginUseCase {
  constructor({ adminRepository, passwordHasher, tokenService }) {
    this.adminRepository = adminRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password } = {}) {
    if (!email || !password) {
      throw new ValidationError('Vui lòng nhập email và mật khẩu.');
    }
    const cleanedEmail = String(email).trim().toLowerCase();
    const admin = await this.adminRepository.findByEmail(cleanedEmail, {
      includePasswordHash: true,
    });

    if (!admin || !this.passwordHasher.verify(String(password), admin.passwordHash)) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng.');
    }
    if (!admin.isActive) {
      throw new ForbiddenError('Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Super Admin.');
    }

    const token = this.tokenService.sign({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const { passwordHash: _omit, ...safeAdmin } = admin;
    return { token, admin: safeAdmin };
  }
}

export class GetProfileUseCase {
  constructor({ dbMode }) {
    this.dbMode = dbMode;
  }

  async execute(actor) {
    return {
      admin: actor,
      database: this.dbMode,
      roles: listRoleDefinitions(),
      permissionCatalog: PERMISSION_CATALOG,
    };
  }
}

export class ChangePasswordUseCase {
  constructor({ adminRepository, passwordHasher }) {
    this.adminRepository = adminRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(actor, input) {
    const { currentPassword, newPassword } = validatePasswordChange(input);
    const admin = await this.adminRepository.findById(actor.id, { includePasswordHash: true });
    if (!admin || !this.passwordHasher.verify(currentPassword, admin.passwordHash)) {
      throw new ValidationError('Mật khẩu hiện tại không đúng.');
    }
    await this.adminRepository.updatePassword(admin.id, this.passwordHasher.hash(newPassword));
    return { ok: true, message: 'Đổi mật khẩu thành công.' };
  }
}
