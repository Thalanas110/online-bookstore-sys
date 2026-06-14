import { HttpError } from './errors.js';

function readEnv(env, keys) {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

function requireEnv(env, label, keys) {
  const value = readEnv(env, keys);
  if (!value) {
    throw new HttpError(500, 'config_error', `Missing required environment variable: ${label}`);
  }

  return value;
}

function normalizeBasePath(value) {
  const trimmed = String(value ?? '/api').trim();
  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, '');
  return withoutSlashes ? `/${withoutSlashes}` : '/api';
}

function parseAllowedOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function decodeAesKey(encodedKey) {
  let decoded;

  try {
    decoded = Buffer.from(encodedKey, 'base64');
  } catch {
    throw new HttpError(500, 'config_error', 'AES_KEY_BASE64 must be valid base64');
  }

  if (decoded.length !== 32) {
    throw new HttpError(500, 'config_error', 'AES_KEY_BASE64 must decode to exactly 32 bytes');
  }

  return decoded;
}

export function loadConfig(env = process.env) {
  const appwriteEndpoint = requireEnv(env, 'APPWRITE_ENDPOINT', [
    'APPWRITE_ENDPOINT',
    'PUBLIC_APPWRITE_ENDPOINT',
  ]);
  const appwriteProjectId = requireEnv(env, 'APPWRITE_PROJECT_ID', [
    'APPWRITE_PROJECT_ID',
    'APPWRITE_FUNCTION_PROJECT_ID',
  ]);
  const appwriteApiKey = requireEnv(env, 'APPWRITE_API_KEY', [
    'APPWRITE_API_KEY',
    'APPWRITE_KEY',
  ]);
  const mongoUri = requireEnv(env, 'MONGODB_URI', ['MONGODB_URI']);
  const mongoDbName = requireEnv(env, 'MONGODB_DB_NAME', ['MONGODB_DB_NAME']);
  const aesKeyBase64 = requireEnv(env, 'AES_KEY_BASE64', ['AES_KEY_BASE64']);

  return {
    appwriteEndpoint,
    appwriteProjectId,
    appwriteApiKey,
    mongoUri,
    mongoDbName,
    apiBasePath: normalizeBasePath(env.API_BASE_PATH ?? '/api'),
    corsAllowedOrigins: parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS ?? ''),
    aesKey: decodeAesKey(aesKeyBase64),
  };
}
