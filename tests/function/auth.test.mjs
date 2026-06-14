import test from 'node:test';
import assert from 'node:assert/strict';

import { authenticateRequest, extractBearerToken, isAdminUser } from '../../appwrite/functions/bookstore-api/src/auth.js';
import { matchRoute } from '../../appwrite/functions/bookstore-api/src/router.js';

const adminUser = {
  $id: 'admin-user',
  name: 'Admin',
  email: 'admin@example.com',
  prefs: { role: 'admin' },
};

const regularUser = {
  $id: 'user-123',
  name: 'Reader',
  email: 'reader@example.com',
  prefs: { role: 'user' },
};

test('extractBearerToken returns the token value when Authorization is valid', () => {
  assert.equal(
    extractBearerToken({ authorization: 'Bearer jwt-token-value' }),
    'jwt-token-value',
  );
});

test('authenticateRequest allows public routes without a JWT', async () => {
  const route = matchRoute('POST', '/api/auth/login', '/api');

  const context = await authenticateRequest({
    route,
    request: { headers: {} },
    appwrite: {
      getUserFromJwt: async () => {
        throw new Error('should not be called');
      },
    },
  });

  assert.equal(context.user, null);
});

test('authenticateRequest rejects protected routes without a JWT', async () => {
  const route = matchRoute('GET', '/api/books', '/api');

  await assert.rejects(
    authenticateRequest({
      route,
      request: { headers: {} },
      appwrite: { getUserFromJwt: async () => regularUser },
    }),
    /Authentication required/,
  );
});

test('authenticateRequest resolves a user from a JWT on protected routes', async () => {
  const route = matchRoute('GET', '/api/books', '/api');

  const context = await authenticateRequest({
    route,
    request: { headers: { authorization: 'Bearer valid-jwt', 'user-agent': 'TestAgent/1.0' } },
    appwrite: {
      getUserFromJwt: async ({ jwt, userAgent }) => {
        assert.equal(jwt, 'valid-jwt');
        assert.equal(userAgent, 'TestAgent/1.0');
        return regularUser;
      },
    },
  });

  assert.equal(context.user.$id, regularUser.$id);
  assert.equal(context.jwt, 'valid-jwt');
});

test('authenticateRequest rejects admin routes for non-admin users', async () => {
  const route = matchRoute('GET', '/api/admin/users', '/api');

  await assert.rejects(
    authenticateRequest({
      route,
      request: { headers: { authorization: 'Bearer user-jwt' } },
      appwrite: {
        getUserFromJwt: async () => regularUser,
      },
    }),
    /Admin access required/,
  );
});

test('isAdminUser detects admin role through prefs', () => {
  assert.equal(isAdminUser(adminUser), true);
  assert.equal(isAdminUser(regularUser), false);
});
