import { normalizeAdminUser } from '../../../domain/entities/AdminUser.js';

export class SqliteAdminRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email, opts = {}) {
    const row = this.db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    return normalizeAdminUser(row, opts);
  }

  async findById(id, opts = {}) {
    const row = this.db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    return normalizeAdminUser(row, opts);
  }

  async findAll() {
    const rows = this.db.prepare('SELECT * FROM admins ORDER BY id ASC').all();
    return rows.map((r) => normalizeAdminUser(r));
  }

  async create({ email, name, passwordHash, role, isActive = true }) {
    const res = this.db
      .prepare(
        `INSERT INTO admins (email, name, password_hash, role, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(email, name, passwordHash, role, isActive ? 1 : 0);
    return this.findById(res.lastInsertRowid);
  }

  async update(id, patch) {
    const fields = [];
    const values = [];

    if (patch.name !== undefined) {
      fields.push('name = ?');
      values.push(patch.name);
    }
    if (patch.role !== undefined) {
      fields.push('role = ?');
      values.push(patch.role);
    }
    if (patch.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(patch.isActive ? 1 : 0);
    }
    if (patch.passwordHash !== undefined) {
      fields.push('password_hash = ?');
      values.push(patch.passwordHash);
    }
    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  async updatePassword(id, passwordHash) {
    this.db
      .prepare("UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(passwordHash, id);
  }

  async countActiveByRole(role) {
    const row = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM admins WHERE role = ? AND is_active = 1')
      .get(role);
    return Number(row?.cnt || 0);
  }

  async delete(id) {
    return this.db.prepare('DELETE FROM admins WHERE id = ?').run(id).changes > 0;
  }
}
