import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Check,
  X,
  Lock,
  Unlock,
  Users,
} from 'lucide-react';

const ROLE_BADGE = {
  superadmin: 'bg-rose-100 text-rose-800 border-rose-200',
  manager: 'bg-sky-100 text-sky-800 border-sky-200',
  staff: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  editor: 'bg-amber-100 text-amber-800 border-amber-200',
};

const EMPTY_USER = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
};

export default function UsersRbacTab({
  currentUser,
  users,
  roles,
  permissionCatalog,
  canWrite,
  canDelete,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) {
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data }
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.mode === 'create') {
        await onCreateUser(modal.data);
      } else {
        const patch = {
          name: modal.data.name,
          role: modal.data.role,
          isActive: modal.data.isActive,
        };
        if (modal.data.password) patch.password = modal.data.password;
        await onUpdateUser(modal.data.id, patch);
      }
      setModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Group permissions by group name for the RBAC Matrix
  const groupedPermissions = (permissionCatalog || []).reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Staff accounts section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#134377]" />
            <div>
              <h2 className="font-bold text-base text-[#134377]">
                Danh sách tài khoản nhân sự ({users.length})
              </h2>
              <p className="text-xs text-gray-500">
                Phân quyền chi tiết theo vai trò RBAC — có hiệu lực ngay lập tức sau khi cập nhật
              </p>
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => setModal({ mode: 'create', data: { ...EMPTY_USER } })}
              className="h-10 px-4 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân sự</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nhân sự</th>
                  <th className="px-4 py-3">Vai trò (Role)</th>
                  <th className="px-4 py-3">Số quyền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#134377]">
                          {u.name}{' '}
                          {isSelf && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-[#edf8ff] text-[#0972b6] text-[10px] font-bold">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {u.roleLabel || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                        {(u.permissions || []).length} quyền
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canWrite && (
                            <button
                              onClick={() =>
                                setModal({
                                  mode: 'edit',
                                  data: {
                                    id: u.id,
                                    name: u.name,
                                    email: u.email,
                                    role: u.role,
                                    isActive: u.isActive,
                                    password: '',
                                  },
                                })
                              }
                              className="p-2 rounded-lg text-[#0972b6] hover:bg-[#edf8ff] cursor-pointer"
                              title="Sửa / Phân quyền"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canWrite && !isSelf && (
                            <button
                              onClick={() =>
                                onUpdateUser(u.id, { isActive: !u.isActive })
                              }
                              className={`p-2 rounded-lg cursor-pointer ${
                                u.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {u.isActive ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {canDelete && !isSelf && (
                            <button
                              onClick={() => onDeleteUser(u)}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RBAC Role Cards & Permission Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-[#0972b6]" />
          <div>
            <h2 className="font-bold text-base text-[#134377]">
              Ma trận phân quyền RBAC (Role-Based Access Control)
            </h2>
            <p className="text-xs text-gray-500">
              Kiểm soát chặt cả tầng HTTP Middleware lẫn Application Use Cases (Clean Architecture)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-5 border-b border-gray-100 bg-gray-50/50">
          {(roles || []).map((role) => (
            <div key={role.key} className="bg-white rounded-lg border border-gray-200 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    ROLE_BADGE[role.key] || 'bg-gray-100'
                  }`}
                >
                  {role.label}
                </span>
                <span className="text-[11px] font-bold text-gray-400">
                  {role.permissions.length} quyền
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nhóm chức năng</th>
                <th className="px-4 py-3">Quyền hạn</th>
                {(roles || []).map((r) => (
                  <th key={r.key} className="px-3 py-3 text-center">
                    {r.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(groupedPermissions).map(([group, perms]) =>
                perms.map((perm, idx) => (
                  <tr key={perm.key} className="hover:bg-gray-50">
                    {idx === 0 && (
                      <td
                        rowSpan={perms.length}
                        className="px-4 py-2.5 font-bold text-[#134377] bg-gray-50/40 border-r border-gray-100 align-top"
                      >
                        {group}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-800">{perm.label}</span>
                      <span className="ml-2 font-mono text-[10px] text-gray-400">{perm.key}</span>
                    </td>
                    {(roles || []).map((r) => {
                      const allowed = r.permissions.includes(perm.key);
                      return (
                        <td key={r.key} className="px-3 py-2.5 text-center">
                          {allowed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Staff Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 bg-[#134377] text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg uppercase">
                {modal.mode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật nhân sự & phân quyền'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={modal.data.name}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, name: e.target.value } })
                  }
                  placeholder="Nguyễn Văn B"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  disabled={modal.mode === 'edit'}
                  value={modal.data.email}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, email: e.target.value } })
                  }
                  placeholder="nhanvien@xraptor.vn"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  {modal.mode === 'create'
                    ? 'Mật khẩu (tối thiểu 6 ký tự) *'
                    : 'Đặt lại mật khẩu mới (bỏ trống nếu giữ nguyên)'}
                </label>
                <input
                  type="password"
                  required={modal.mode === 'create'}
                  minLength={modal.mode === 'create' ? 6 : undefined}
                  value={modal.data.password}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, password: e.target.value } })
                  }
                  placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Vai trò phân quyền *
                </label>
                <select
                  value={modal.data.role}
                  disabled={modal.mode === 'edit' && modal.data.id === currentUser?.id}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, role: e.target.value } })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-gray-100"
                >
                  {(roles || []).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label} ({r.permissions.length} quyền)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  {(roles || []).find((r) => r.key === modal.data.role)?.description}
                </p>
              </div>

              {!(modal.mode === 'edit' && modal.data.id === currentUser?.id) && (
                <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(modal.data.isActive)}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, isActive: e.target.checked } })
                    }
                    className="w-4 h-4 accent-[#134377]"
                  />
                  <span>Tài khoản đang hoạt động (cho phép đăng nhập)</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 rounded-lg bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
                >
                  {submitting
                    ? 'Đang lưu...'
                    : modal.mode === 'create'
                      ? 'Tạo tài khoản'
                      : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
