import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4 || 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLength), 'base64');
}

export function encryptString(plaintext, key) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    alg: 'A256GCM',
    iv: toBase64Url(iv),
    tag: toBase64Url(tag),
    data: toBase64Url(encrypted),
  };
}

export function decryptString(payload, key) {
  const decipher = createDecipheriv(ALGORITHM, key, fromBase64Url(payload.iv), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(fromBase64Url(payload.tag));

  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(payload.data)),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function serializeEncryptedField(payload) {
  return JSON.stringify(payload);
}

export function deserializeEncryptedField(serialized) {
  if (typeof serialized === 'string') {
    return JSON.parse(serialized);
  }

  return serialized;
}
