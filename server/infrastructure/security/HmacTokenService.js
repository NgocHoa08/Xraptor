import crypto from 'crypto';

export class HmacTokenService {
  constructor(secret, ttlMs = 7 * 24 * 60 * 60 * 1000) {
    this.secret = secret;
    this.ttlMs = ttlMs;
  }

  sign(payload) {
    const data = {
      ...payload,
      exp: Date.now() + this.ttlMs,
    };
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  verify(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', this.secret).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    try {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
