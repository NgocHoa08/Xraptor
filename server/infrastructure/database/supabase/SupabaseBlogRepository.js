import { normalizeBlog } from '../../../domain/entities/Blog.js';

export class SupabaseBlogRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async findAll() {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(normalizeBlog);
  }

  async findById(id) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeBlog(data);
  }

  async create(data) {
    await this.ensureSeeded();
    const { data: row, error } = await this.supabase
      .from('blogs')
      .insert({
        id: data.id,
        tag: data.tag,
        published_date: data.date,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizeBlog(row);
  }

  async update(id, data) {
    const { data: row, error } = await this.supabase
      .from('blogs')
      .update({
        tag: data.tag,
        published_date: data.date,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizeBlog(row);
  }

  async delete(id) {
    const { error, count } = await this.supabase
      .from('blogs')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }
}
