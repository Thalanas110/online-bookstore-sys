import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../../appwrite/functions/bookstore-api/src/config.js';

const VALID_ENV = {
  APPWRITE_ENDPOINT: 'https://example.appwrite.io/v1',
  APPWRITE_PROJECT_ID: 'bookstore-project',
  APPWRITE_API_KEY: 'secret-api-key',
  APPWRITE_DATABASE_ID: 'bookstore-db',
  APPWRITE_BOOKS_TABLE_ID: 'books',
  APPWRITE_ORDERS_TABLE_ID: 'orders',
  APPWRITE_PROFILES_TABLE_ID: 'profiles',
  AES_KEY_BASE64: Buffer.alloc(32, 7).toString('base64'),
};

test('loadConfig returns normalized settings when environment is valid', () => {
  const config = loadConfig({
    ...VALID_ENV,
    API_BASE_PATH: 'api/',
    CORS_ALLOWED_ORIGINS: 'https://app.example.com, http://localhost:5173 ',
  });

  assert.equal(config.apiBasePath, '/api');
  assert.deepEqual(config.corsAllowedOrigins, [
    'https://app.example.com',
    'http://localhost:5173',
  ]);
  assert.equal(config.aesKey.length, 32);
});

test('loadConfig throws when a required variable is missing', () => {
  assert.throws(
    () => loadConfig({ ...VALID_ENV, APPWRITE_DATABASE_ID: '' }),
    /APPWRITE_DATABASE_ID/,
  );
});

test('loadConfig throws when AES key is not 32 bytes', () => {
  assert.throws(
    () => loadConfig({
      ...VALID_ENV,
      AES_KEY_BASE64: Buffer.alloc(16, 1).toString('base64'),
    }),
    /AES_KEY_BASE64/,
  );
});
