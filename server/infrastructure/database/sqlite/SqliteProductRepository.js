import { normalizeProduct } from '../../../domain/entities/Product.js';

export class SqliteProductRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll({ category, subCategory, featured, search, sort } = {}) {
    const where = [];
    const params = [];

    if (category) {
      where.push('category = ?');
      params.push(String(category));
    }
    if (subCategory) {
      where.push('sub_category = ?');
      params.push(String(subCategory));
    }
    if (featured === '1' || featured === 'true' || featured === true) {
      where.push('featured = 1');
    }
    if (search) {
      where.push('(LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?)');
      const q = `%${String(search).toLowerCase()}%`;
      params.push(q, q, q);
    }

    let orderSql = 'ORDER BY rowid ASC';
    if (sort === 'price-asc') orderSql = 'ORDER BY price ASC';
    else if (sort === 'price-desc') orderSql = 'ORDER BY price DESC';
    else if (sort === 'name-asc') orderSql = 'ORDER BY name ASC';
    else if (sort === 'newest') orderSql = 'ORDER BY created_at DESC, rowid DESC';

    const rows = this.db
      .prepare(`SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${orderSql}`)
      .all(...params);

    return rows.map(normalizeProduct);
  }

  async findById(id) {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return normalizeProduct(row);
  }

  async create(data) {
    this.db
      .prepare(
        `INSERT INTO products (id, sku, name, price, old_price, stock, category, sub_category, featured, image, gallery, specs, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.id,
        data.sku,
        data.name,
        data.price,
        data.oldPrice,
        data.stock,
        data.category,
        data.subCategory,
        data.featured ? 1 : 0,
        data.image,
        JSON.stringify(data.gallery),
        data.specs,
        data.description
      );
    return this.findById(data.id);
  }

  async update(id, data) {
    this.db
      .prepare(
        `UPDATE products
         SET sku = ?, name = ?, price = ?, old_price = ?, stock = ?, category = ?, sub_category = ?,
             featured = ?, image = ?, gallery = ?, specs = ?, description = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        data.sku,
        data.name,
        data.price,
        data.oldPrice,
        data.stock,
        data.category,
        data.subCategory,
        data.featured ? 1 : 0,
        data.image,
        JSON.stringify(data.gallery),
        data.specs,
        data.description,
        id
      );
    return this.findById(id);
  }

  async decrementStock(id, qty) {
    this.db
      .prepare("UPDATE products SET stock = MAX(0, stock - ?), updated_at = datetime('now') WHERE id = ?")
      .run(qty, id);
  }

  async delete(id) {
    return this.db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
  }
}
