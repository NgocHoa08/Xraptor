import { ForbiddenError } from '../errors/AppError.js';

export const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  STAFF: 'staff',
  EDITOR: 'editor',
});

export const PERMISSIONS = Object.freeze({
  DASHBOARD_READ: 'dashboard:read',

  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',

  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',

  PAYMENTS_READ: 'payments:read',
  PAYMENTS_VERIFY: 'payments:verify',
  PAYMENTS_REFUND: 'payments:refund',

  CONTACTS_READ: 'contacts:read',
  CONTACTS_UPDATE: 'contacts:update',
  CONTACTS_DELETE: 'contacts:delete',

  BLOGS_READ: 'blogs:read',
  BLOGS_WRITE: 'blogs:write',
  BLOGS_DELETE: 'blogs:delete',

  SUBSCRIBERS_READ: 'subscribers:read',
  SUBSCRIBERS_DELETE: 'subscribers:delete',

  MEDIA_UPLOAD: 'media:upload',

  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
});

export const PERMISSION_CATALOG = Object.freeze([
  { key: PERMISSIONS.DASHBOARD_READ, group: 'Tổng quan', label: 'Xem báo cáo & KPI' },
  { key: PERMISSIONS.PRODUCTS_READ, group: 'Sản phẩm', label: 'Xem danh sách sản phẩm' },
  { key: PERMISSIONS.PRODUCTS_WRITE, group: 'Sản phẩm', label: 'Thêm / Sửa sản phẩm' },
  { key: PERMISSIONS.PRODUCTS_DELETE, group: 'Sản phẩm', label: 'Xóa sản phẩm' },
  { key: PERMISSIONS.ORDERS_READ, group: 'Đơn hàng', label: 'Xem đơn hàng' },
  { key: PERMISSIONS.ORDERS_UPDATE, group: 'Đơn hàng', label: 'Cập nhật trạng thái đơn' },
  { key: PERMISSIONS.ORDERS_DELETE, group: 'Đơn hàng', label: 'Xóa đơn hàng' },
  { key: PERMISSIONS.PAYMENTS_READ, group: 'Thanh toán', label: 'Xem lịch sử giao dịch' },
  { key: PERMISSIONS.PAYMENTS_VERIFY, group: 'Thanh toán', label: 'Xác nhận đã thu tiền (VietQR/COD)' },
  { key: PERMISSIONS.PAYMENTS_REFUND, group: 'Thanh toán', label: 'Hoàn tiền giao dịch' },
  { key: PERMISSIONS.CONTACTS_READ, group: 'Liên hệ', label: 'Xem liên hệ khách hàng' },
  { key: PERMISSIONS.CONTACTS_UPDATE, group: 'Liên hệ', label: 'Đánh dấu xử lý liên hệ' },
  { key: PERMISSIONS.CONTACTS_DELETE, group: 'Liên hệ', label: 'Xóa liên hệ' },
  { key: PERMISSIONS.BLOGS_READ, group: 'Blog', label: 'Xem bài viết' },
  { key: PERMISSIONS.BLOGS_WRITE, group: 'Blog', label: 'Đăng / Sửa bài viết' },
  { key: PERMISSIONS.BLOGS_DELETE, group: 'Blog', label: 'Xóa bài viết' },
  { key: PERMISSIONS.SUBSCRIBERS_READ, group: 'Bản tin', label: 'Xem & xuất CSV subscribers' },
  { key: PERMISSIONS.SUBSCRIBERS_DELETE, group: 'Bản tin', label: 'Xóa subscriber' },
  { key: PERMISSIONS.MEDIA_UPLOAD, group: 'Media', label: 'Tải ảnh lên hệ thống' },
  { key: PERMISSIONS.USERS_READ, group: 'Nhân sự & Phân quyền', label: 'Xem tài khoản nhân sự' },
  { key: PERMISSIONS.USERS_WRITE, group: 'Nhân sự & Phân quyền', label: 'Tạo / Sửa / Phân quyền nhân sự' },
  { key: PERMISSIONS.USERS_DELETE, group: 'Nhân sự & Phân quyền', label: 'Xóa tài khoản nhân sự' },
]);

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_DEFINITIONS = Object.freeze({
  [ROLES.SUPERADMIN]: {
    key: ROLES.SUPERADMIN,
    label: 'Super Admin',
    description: 'Toàn quyền hệ thống, bao gồm quản lý nhân sự, phân quyền, xóa đơn hàng và hoàn tiền.',
    permissions: ALL_PERMISSIONS,
  },
  [ROLES.MANAGER]: {
    key: ROLES.MANAGER,
    label: 'Quản lý (Manager)',
    description: 'Quản lý kho sản phẩm, đơn hàng, xác nhận/hoàn tiền thanh toán, liên hệ và nội dung.',
    permissions: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.PRODUCTS_WRITE,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.PAYMENTS_READ,
      PERMISSIONS.PAYMENTS_VERIFY,
      PERMISSIONS.PAYMENTS_REFUND,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.CONTACTS_UPDATE,
      PERMISSIONS.CONTACTS_DELETE,
      PERMISSIONS.BLOGS_READ,
      PERMISSIONS.BLOGS_WRITE,
      PERMISSIONS.BLOGS_DELETE,
      PERMISSIONS.SUBSCRIBERS_READ,
      PERMISSIONS.SUBSCRIBERS_DELETE,
      PERMISSIONS.MEDIA_UPLOAD,
    ],
  },
  [ROLES.STAFF]: {
    key: ROLES.STAFF,
    label: 'Nhân viên (Staff)',
    description: 'Xử lý đơn hàng, xác nhận thanh toán COD/VietQR và chăm sóc liên hệ khách hàng.',
    permissions: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.PAYMENTS_READ,
      PERMISSIONS.PAYMENTS_VERIFY,
      PERMISSIONS.CONTACTS_READ,
      PERMISSIONS.CONTACTS_UPDATE,
    ],
  },
  [ROLES.EDITOR]: {
    key: ROLES.EDITOR,
    label: 'Biên tập viên (Editor)',
    description: 'Quản lý Blog - Tin tức, tải ảnh truyền thông và xem danh sách đăng ký nhận tin.',
    permissions: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.BLOGS_READ,
      PERMISSIONS.BLOGS_WRITE,
      PERMISSIONS.BLOGS_DELETE,
      PERMISSIONS.SUBSCRIBERS_READ,
      PERMISSIONS.MEDIA_UPLOAD,
    ],
  },
});

export const VALID_ROLES = Object.freeze(Object.keys(ROLE_DEFINITIONS));

export function isValidRole(role) {
  return typeof role === 'string' && Object.prototype.hasOwnProperty.call(ROLE_DEFINITIONS, role);
}

export function getPermissionsForRole(role) {
  return ROLE_DEFINITIONS[role]?.permissions ? [...ROLE_DEFINITIONS[role].permissions] : [];
}

export function hasPermission(role, permission) {
  const perms = ROLE_DEFINITIONS[role]?.permissions || [];
  return perms.includes(permission);
}

export function hasAnyPermission(role, permissions = []) {
  return permissions.some((p) => hasPermission(role, p));
}

export function assertPermission(actor, permission) {
  if (!actor || !hasPermission(actor.role, permission)) {
    throw new ForbiddenError(`Vai trò "${actor?.role || 'guest'}" không có quyền "${permission}".`);
  }
}

export function listRoleDefinitions() {
  return VALID_ROLES.map((key) => ROLE_DEFINITIONS[key]);
}
