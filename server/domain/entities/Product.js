import { ValidationError } from '../errors/AppError.js';

export function normalizeProduct(row) {
  if (!row) return null;
  let gallery = [];
  if (Array.isArray(row.gallery)) {
    gallery = row.gallery;
  } else if (typeof row.gallery === 'string') {
    try {
      gallery = JSON.parse(row.gallery || '[]');
    } catch {
      gallery = [row.image];
    }
  }
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    oldPrice: Number(row.old_price || 0),
    stock: Number(row.stock || 0),
    category: row.category,
    subCategory: row.sub_category || '',
    featured: Boolean(row.featured),
    image: row.image,
    gallery: gallery.length ? gallery : [row.image],
    specs: row.specs || '',
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateCreateProductInput(body = {}) {
  const { sku, name, price, category, image } = body;
  if (!name || !sku || !category || !image || Number(price) <= 0) {
    throw new ValidationError('Vui lòng điền đầy đủ Mã SKU, Tên, Danh mục, Giá và Hình ảnh.');
  }
  const gallery =
    Array.isArray(body.gallery) && body.gallery.length ? body.gallery : [String(image).trim()];
  return {
    id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    sku: String(sku).trim(),
    name: String(name).trim(),
    price: Math.round(Number(price)),
    oldPrice: Math.round(Number(body.oldPrice) || 0),
    stock: Math.max(0, Math.round(Number(body.stock) || 0)),
    category: String(category).trim(),
    subCategory: String(body.subCategory || '').trim(),
    featured: Boolean(body.featured),
    image: String(image).trim(),
    gallery,
    specs: String(body.specs || ''),
    description: String(body.description || ''),
  };
}

export function mergeProductUpdate(existing, body = {}) {
  if (body.price !== undefined && Number(body.price) <= 0) {
    throw new ValidationError('Giá sản phẩm phải lớn hơn 0.');
  }
  const nextImage = body.image ?? existing.image;
  const nextGallery = Array.isArray(body.gallery)
    ? body.gallery.length
      ? body.gallery
      : [nextImage]
    : existing.gallery;

  return {
    sku: body.sku !== undefined ? String(body.sku).trim() : existing.sku,
    name: body.name !== undefined ? String(body.name).trim() : existing.name,
    price: body.price !== undefined ? Math.round(Number(body.price)) : existing.price,
    oldPrice:
      body.oldPrice !== undefined ? Math.round(Number(body.oldPrice) || 0) : existing.oldPrice,
    stock:
      body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock) || 0)) : existing.stock,
    category: body.category !== undefined ? String(body.category).trim() : existing.category,
    subCategory:
      body.subCategory !== undefined ? String(body.subCategory).trim() : existing.subCategory,
    featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
    image: nextImage,
    gallery: nextGallery,
    specs: body.specs !== undefined ? String(body.specs) : existing.specs,
    description: body.description !== undefined ? String(body.description) : existing.description,
  };
}
