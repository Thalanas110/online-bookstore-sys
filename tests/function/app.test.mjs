import test from 'node:test';
import assert from 'node:assert/strict';

import { createApplication } from '../../appwrite/functions/bookstore-api/src/app.js';

function createApp() {
  return createApplication({
    config: {
      apiBasePath: '/api',
      corsAllowedOrigins: ['https://app.example.com'],
    },
    appwrite: {
      async getUserFromJwt() {
        return {
          $id: 'user-1',
          name: 'Reader',
          email: 'reader@example.com',
          prefs: { role: 'user' },
        };
      },
    },
    routeHandlers: {
      'auth.login': async () => ({
        statusCode: 200,
        body: { ok: true },
      }),
      'books.list': async () => ({
        statusCode: 200,
        body: [{ $id: 'book-1' }],
      }),
    },
  });
}

test('application dispatches a matched route and returns security headers', async () => {
  const app = createApp();

  const response = await app({
    method: 'POST',
    path: '/api/auth/login',
    headers: {
      origin: 'https://app.example.com',
    },
    bodyJson: {
      email: 'reader@example.com',
      password: 'password123',
    },
    query: {},
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://app.example.com');
  assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
});

test('application rejects disallowed browser origins', async () => {
  const app = createApp();

  const response = await app({
    method: 'GET',
    path: '/api/auth/login',
    headers: {
      origin: 'https://evil.example.com',
    },
    query: {},
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.type, 'forbidden');
});

test('application returns a preflight response for OPTIONS requests', async () => {
  const app = createApp();

  const response = await app({
    method: 'OPTIONS',
    path: '/api/books',
    headers: {
      origin: 'https://app.example.com',
    },
    query: {},
  });

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers['Access-Control-Allow-Methods'].includes('GET'), true);
});

test('application enforces JWT auth on protected routes', async () => {
  const app = createApp();

  const response = await app({
    method: 'GET',
    path: '/api/books',
    headers: {
      origin: 'https://app.example.com',
    },
    query: {},
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.type, 'unauthorized');
});

test('application returns 404 for unknown routes', async () => {
  const app = createApp();

  const response = await app({
    method: 'GET',
    path: '/api/unknown',
    headers: {
      origin: 'https://app.example.com',
    },
    query: {},
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.type, 'not_found');
});
