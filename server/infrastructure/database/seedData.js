import {
  SEED_PRODUCTS,
  SEED_BLOGS,
  SEED_ORDERS,
  SEED_CONTACTS,
  SEED_SUBSCRIBERS,
} from '../../seedData.js';
import { ROLES } from '../../domain/rbac/permissions.js';

export const SEED_ADMINS = [
  {
    email: 'admin@xraptor.vn',
    name: 'Quản trị viên Xraptor',
    password: 'admin123',
    role: ROLES.SUPERADMIN,
    isActive: true,
  },
  {
    email: 'manager@xraptor.vn',
    name: 'Nguyễn Minh Quân (Manager)',
    password: 'manager123',
    role: ROLES.MANAGER,
    isActive: true,
  },
  {
    email: 'staff@xraptor.vn',
    name: 'Trần Hải Yến (Staff)',
    password: 'staff123',
    role: ROLES.STAFF,
    isActive: true,
  },
  {
    email: 'editor@xraptor.vn',
    name: 'Lê Thu Thảo (Editor)',
    password: 'editor123',
    role: ROLES.EDITOR,
    isActive: true,
  },
];

export { SEED_PRODUCTS, SEED_BLOGS, SEED_ORDERS, SEED_CONTACTS, SEED_SUBSCRIBERS };
