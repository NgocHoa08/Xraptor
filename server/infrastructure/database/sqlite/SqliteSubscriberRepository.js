export class SqliteSubscriberRepository {
  constructor(db) {
    this.db = db;
  }

  async create(email) {
    this.db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
    return { ok: true, email };
  }

  async findAll() {
    return this.db.prepare('SELECT * FROM subscribers ORDER BY id DESC').all();
  }

  async delete(id) {
    this.db.prepare('DELETE FROM subscribers WHERE id = ?').run(id);
    return true;
  }
}
