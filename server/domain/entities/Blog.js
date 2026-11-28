import { ValidationError } from '../errors/AppError.js';

export function normalizeBlog(row) {
  if (!row) return null;
  return {
    id: row.id,
    tag: row.tag,
    date: row.published_date,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content || '',
    image: row.image,
    createdAt: row.created_at,
  };
}

export function validateCreateBlogInput(body = {}) {
  const { tag, date, title, excerpt, content, image } = body;
  if (!title || !image) {
    throw new ValidationError('Vui lòng nhập tiêu đề và hình ảnh bài viết.');
  }
  const pubDate =
    date ||
    new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    id: `blog-${Date.now().toString(36)}`,
    tag: String(tag || 'Tin tức').trim(),
    date: String(pubDate).trim(),
    title: String(title).trim(),
    excerpt: String(excerpt || '').trim(),
    content: String(content || '').trim(),
    image: String(image).trim(),
  };
}

export function mergeBlogUpdate(existing, body = {}) {
  return {
    tag: body.tag ?? existing.tag,
    date: body.date ?? existing.date,
    title: body.title !== undefined ? String(body.title).trim() : existing.title,
    excerpt: body.excerpt !== undefined ? String(body.excerpt).trim() : existing.excerpt,
    content: body.content !== undefined ? String(body.content).trim() : existing.content,
    image: body.image !== undefined ? String(body.image).trim() : existing.image,
  };
}
