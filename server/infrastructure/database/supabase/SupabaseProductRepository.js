import { normalizeProduct } from '../../../domain/entities/Product.js';

export class SupabaseProductRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async findAll({ category, subCategory, featured, search, sort } = {}) {
    await this.ensureSeeded();
    let q = this.supabase.from('products').select('*');
    if (category) q = q.eq('category', String(category));
    if (subCategory) q = q.eq('sub_category', String(subCategory));
    if (featured === '1' || featured === 'true' || featured === true) q = q.eq('featured', true);

    if (sort === 'price-asc') q = q.order('price', { ascending: true });
    else if (sort === 'price-desc') q = q.order('price', { ascending: false });
    else if (sort === 'name-asc') q = q.order('name', { ascending: true });
    else if (sort === 'newest') q = q.order('created_at', { ascending: false });
    else q = q.order('created_at', { ascending: true });

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    let list = (data || []).map(normalizeProduct);
    if (search) {
      const term = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }
    return list;
  }

  async findById(id) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeProduct(data);
  }

  async create(data) {
    await this.ensureSeeded();
    const { data: row, error } = await this.supabase
      .from('products')
      .insert({
        id: data.id,
        sku: data.sku,
        name: data.name,
        price: data.price,
        old_price: data.oldPrice,
        stock: data.stock,
        category: data.category,
        sub_category: data.subCategory,
        featured: data.featured,
        image: data.image,
        gallery: data.gallery,
        specs: data.specs,
        description: data.description,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizeProduct(row);
  }

  async update(id, data) {
    const { data: row, error } = await this.supabase
      .from('products')
      .update({
        sku: data.sku,
        name: data.name,
        price: data.price,
        old_price: data.oldPrice,
        stock: data.stock,
        category: data.category,
        sub_category: data.subCategory,
        featured: data.featured,
        image: data.image,
        gallery: data.gallery,
        specs: data.specs,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizeProduct(row);
  }

  async decrementStock(id, qty) {
    const existing = await this.findById(id);
    if (!existing) return;
    await this.supabase
      .from('products')
      .update({
        stock: Math.max(0, existing.stock - qty),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async delete(id) {
    const { error, count } = await this.supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }
}
