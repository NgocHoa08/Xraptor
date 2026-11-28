import crypto from 'crypto';

export class ScryptPasswordHasher {
  hash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  verify(password, stored) {
    const [salt, key] = String(stored || '').split(':');
    if (!salt || !key) return false;
    const derived = crypto.scryptSync(String(password), salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (derived.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(derived, keyBuf);
  }
}
