import test from 'node:test';
import assert from 'node:assert/strict';

import {
  decryptString,
  encryptString,
  serializeEncryptedField,
  deserializeEncryptedField,
} from '../../appwrite/functions/bookstore-api/src/crypto.js';

const PRIMARY_KEY = Buffer.alloc(32, 1);
const SECONDARY_KEY = Buffer.alloc(32, 2);

test('encryptString and decryptString round-trip plaintext', () => {
  const payload = encryptString('123 Main St, Springfield', PRIMARY_KEY);
  const decrypted = decryptString(payload, PRIMARY_KEY);

  assert.equal(payload.alg, 'A256GCM');
  assert.equal(decrypted, '123 Main St, Springfield');
});

test('encryptString uses a unique IV for each operation', () => {
  const first = encryptString('same value', PRIMARY_KEY);
  const second = encryptString('same value', PRIMARY_KEY);

  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.data, second.data);
});

test('decryptString rejects the wrong key', () => {
  const payload = encryptString('secret', PRIMARY_KEY);

  assert.throws(() => decryptString(payload, SECONDARY_KEY));
});

test('serialized encrypted fields can be restored safely', () => {
  const encrypted = encryptString('sensitive', PRIMARY_KEY);
  const serialized = serializeEncryptedField(encrypted);
  const restored = deserializeEncryptedField(serialized);

  assert.deepEqual(restored, encrypted);
  assert.equal(decryptString(restored, PRIMARY_KEY), 'sensitive');
});
