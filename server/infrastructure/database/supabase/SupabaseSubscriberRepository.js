export class SupabaseSubscriberRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async create(email) {
    await this.ensureSeeded();
    const { error } = await this.supabase
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email' });
    if (error) throw new Error(error.message);
    return { ok: true, email };
  }

  async findAll() {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('subscribers')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async delete(id) {
    const { error } = await this.supabase.from('subscribers').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}
