import { normalizeAdminUser } from '../../../domain/entities/AdminUser.js';

export class SupabaseAdminRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async findByEmail(email, opts = {}) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeAdminUser(data, opts);
  }

  async findById(id, opts = {}) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeAdminUser(data, opts);
  }

  async findAll() {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('admins')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => normalizeAdminUser(r));
  }

  async create({ email, name, passwordHash, role, isActive = true }) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('admins')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        role,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizeAdminUser(data);
  }

  async update(id, patch) {
    const body = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.role !== undefined) body.role = patch.role;
    if (patch.isActive !== undefined) body.is_active = patch.isActive;
    if (patch.passwordHash !== undefined) body.password_hash = patch.passwordHash;

    const { data, error } = await this.supabase
      .from('admins')
      .update(body)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeAdminUser(data);
  }

  async updatePassword(id, passwordHash) {
    const { error } = await this.supabase
      .from('admins')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async countActiveByRole(role) {
    const { count, error } = await this.supabase
      .from('admins')
      .select('id', { count: 'exact', head: true })
      .eq('role', role)
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    return Number(count || 0);
  }

  async delete(id) {
    const { error, count } = await this.supabase
      .from('admins')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }
}
