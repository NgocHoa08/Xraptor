import { normalizeBlog } from '../../../domain/entities/Blog.js';

export class SqliteBlogRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    return this.db.prepare('SELECT * FROM blogs ORDER BY rowid DESC').all().map(normalizeBlog);
  }

  async findById(id) {
    return normalizeBlog(this.db.prepare('SELECT * FROM blogs WHERE id = ?').get(id));
  }

  async create(data) {
    this.db
      .prepare(
        'INSERT INTO blogs (id, tag, published_date, title, excerpt, content, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(data.id, data.tag, data.date, data.title, data.excerpt, data.content, data.image);
    return this.findById(data.id);
  }

  async update(id, data) {
    this.db
      .prepare(
        'UPDATE blogs SET tag = ?, published_date = ?, title = ?, excerpt = ?, content = ?, image = ? WHERE id = ?'
      )
      .run(data.tag, data.date, data.title, data.excerpt, data.content, data.image, id);
    return this.findById(id);
  }

  async delete(id) {
    return this.db.prepare('DELETE FROM blogs WHERE id = ?').run(id).changes > 0;
  }
}
