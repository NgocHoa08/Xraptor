import path from 'path';

export class SupabaseFileStorage {
  constructor({ supabase, bucket }) {
    this.supabase = supabase;
    this.bucket = bucket || 'xraptor-uploads';
  }

  async uploadImage(file) {
    const ext = path.extname(file.originalname || '.webp').toLowerCase() || '.webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype || 'image/webp',
        upsert: false,
      });

    if (error) {
      return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }
}
