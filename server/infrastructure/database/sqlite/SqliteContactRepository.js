export class SqliteContactRepository {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const r = this.db
      .prepare(
        'INSERT INTO contacts (full_name, phone, email, order_code, subject, message) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(data.fullName, data.phone, data.email, data.orderCode, data.subject, data.message);
    return this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(r.lastInsertRowid);
  }

  async findAll() {
    return this.db.prepare('SELECT * FROM contacts ORDER BY id DESC').all();
  }

  async updateStatus(id, status) {
    const r = this.db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, id);
    if (r.changes === 0) return null;
    return this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  }

  async delete(id) {
    return this.db.prepare('DELETE FROM contacts WHERE id = ?').run(id).changes > 0;
  }
}
