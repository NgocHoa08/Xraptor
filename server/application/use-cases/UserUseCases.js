import {
  validateCreateAdminInput,
  validateUpdateAdminInput,
} from '../../domain/entities/AdminUser.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors/AppError.js';
import {
  assertPermission,
  listRoleDefinitions,
  PERMISSION_CATALOG,
  PERMISSIONS,
  ROLES,
} from '../../domain/rbac/permissions.js';

export class ListUsersUseCase {
  constructor({ adminRepository }) {
    this.adminRepository = adminRepository;
  }

  async execute(actor) {
    assertPermission(actor, PERMISSIONS.USERS_READ);
    const users = await this.adminRepository.findAll();
    return {
      users,
      roles: listRoleDefinitions(),
      permissionCatalog: PERMISSION_CATALOG,
    };
  }
}

export class GetRolesCatalogUseCase {
  async execute(actor) {
    assertPermission(actor, PERMISSIONS.USERS_READ);
    return {
      roles: listRoleDefinitions(),
      permissionCatalog: PERMISSION_CATALOG,
    };
  }
}

export class CreateUserUseCase {
  constructor({ adminRepository, passwordHasher }) {
    this.adminRepository = adminRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(actor, input) {
    assertPermission(actor, PERMISSIONS.USERS_WRITE);
    const data = validateCreateAdminInput(input);

    const existing = await this.adminRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Email "${data.email}" đã được sử dụng cho tài khoản khác.`);
    }

    const user = await this.adminRepository.create({
      email: data.email,
      name: data.name,
      passwordHash: this.passwordHasher.hash(data.password),
      role: data.role,
      isActive: data.isActive,
    });
    return { user };
  }
}

export class UpdateUserUseCase {
  constructor({ adminRepository, passwordHasher }) {
    this.adminRepository = adminRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(actor, targetId, input) {
    assertPermission(actor, PERMISSIONS.USERS_WRITE);
    const id = Number(targetId);
    const existing = await this.adminRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy tài khoản nhân sự.');
    }

    const patch = validateUpdateAdminInput(input);
    if (Object.keys(patch).length === 0) {
      throw new ValidationError('Không có thông tin nào cần cập nhật.');
    }

    // Prevent locking or demoting yourself
    if (existing.id === actor.id) {
      if (patch.isActive === false) {
        throw new ForbiddenError('Không thể tự khóa tài khoản của chính mình.');
      }
      if (patch.role && patch.role !== existing.role) {
        throw new ForbiddenError('Không thể tự hạ quyền của chính mình.');
      }
    }

    // Prevent removing the last active superadmin
    const wouldLoseSuperadmin =
      existing.role === ROLES.SUPERADMIN &&
      existing.isActive &&
      ((patch.role && patch.role !== ROLES.SUPERADMIN) || patch.isActive === false);

    if (wouldLoseSuperadmin) {
      const activeSuperadmins = await this.adminRepository.countActiveByRole(ROLES.SUPERADMIN);
      if (activeSuperadmins <= 1) {
        throw new ConflictError('Hệ thống phải có ít nhất 1 tài khoản Super Admin đang hoạt động.');
      }
    }

    const updatePayload = { ...patch };
    if (patch.password) {
      updatePayload.passwordHash = this.passwordHasher.hash(patch.password);
      delete updatePayload.password;
    }

    const user = await this.adminRepository.update(id, updatePayload);
    return { user };
  }
}

export class DeleteUserUseCase {
  constructor({ adminRepository }) {
    this.adminRepository = adminRepository;
  }

  async execute(actor, targetId) {
    assertPermission(actor, PERMISSIONS.USERS_DELETE);
    const id = Number(targetId);
    const existing = await this.adminRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy tài khoản nhân sự.');
    }
    if (existing.id === actor.id) {
      throw new ForbiddenError('Không thể tự xóa tài khoản đang đăng nhập.');
    }
    if (existing.role === ROLES.SUPERADMIN && existing.isActive) {
      const activeSuperadmins = await this.adminRepository.countActiveByRole(ROLES.SUPERADMIN);
      if (activeSuperadmins <= 1) {
        throw new ConflictError('Không thể xóa Super Admin cuối cùng của hệ thống.');
      }
    }
    await this.adminRepository.delete(id);
    return { ok: true };
  }
}
