import * as crypto from 'crypto';

const KEY_B64 = process.env.SNMP_ENCRYPTION_KEY || '';
const ALGO = 'aes-256-gcm';

export function encrypt(plaintext: string): string {
  if (!KEY_B64) return plaintext; // Fallback if not configured
  const key = Buffer.from(KEY_B64, 'base64');
  if (key.length !== 32) throw new Error('SNMP_ENCRYPTION_KEY must be 32 bytes (base64)');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(payload: string): string {
  if (!KEY_B64 || !payload.includes(':')) return payload; // Fallback
  const key = Buffer.from(KEY_B64, 'base64');
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
