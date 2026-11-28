export class SupabaseContactRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async create(data) {
    await this.ensureSeeded();
    const { data: row, error } = await this.supabase
      .from('contacts')
      .insert({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        order_code: data.orderCode,
        subject: data.subject,
        message: data.message,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  }

  async findAll() {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from('contacts')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id) {
    const { error, count } = await this.supabase
      .from('contacts')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }
}
