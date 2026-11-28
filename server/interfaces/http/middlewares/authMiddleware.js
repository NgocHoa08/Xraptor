import { ForbiddenError, UnauthorizedError } from '../../../domain/errors/AppError.js';
import { hasAnyPermission, hasPermission } from '../../../domain/rbac/permissions.js';

export function createAuthMiddlewares({ tokenService, adminRepository }) {
  const authenticate = async (req, _res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
      if (!token) {
        return next(new UnauthorizedError('Phiên đăng nhập hết hạn hoặc chưa đăng nhập.'));
      }

      const payload = tokenService.verify(token);
      if (!payload?.id) {
        return next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn.'));
      }

      // Load live account state & fresh role permissions from DB
      const liveUser = await adminRepository.findById(payload.id);
      if (!liveUser) {
        return next(new UnauthorizedError('Tài khoản không còn tồn tại.'));
      }
      if (!liveUser.isActive) {
        return next(new ForbiddenError('Tài khoản đã bị khóa. Vui lòng liên hệ Super Admin.'));
      }

      req.user = liveUser;
      req.admin = liveUser;
      next();
    } catch (err) {
      next(err);
    }
  };

  const requirePermission = (permission) => (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!hasPermission(req.user.role, permission)) {
      return next(
        new ForbiddenError(
          `Vai trò "${req.user.roleLabel || req.user.role}" không có quyền thực hiện thao tác này (${permission}).`
        )
      );
    }
    next();
  };

  const requireAnyPermission = (...permissions) => (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!hasAnyPermission(req.user.role, permissions)) {
      return next(
        new ForbiddenError('Bạn không có đủ quyền truy cập tài nguyên này.')
      );
    }
    next();
  };

  return {
    authenticate,
    requirePermission,
    requireAnyPermission,
  };
}
