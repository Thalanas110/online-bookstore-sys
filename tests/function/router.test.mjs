import test from 'node:test';
import assert from 'node:assert/strict';

import { matchRoute, ROUTES } from '../../appwrite/functions/bookstore-api/src/router.js';

const EXPECTED_ROUTES = [
  ['POST', '/api/auth/register'],
  ['POST', '/api/auth/login'],
  ['POST', '/api/auth/logout'],
  ['GET', '/api/auth/me'],
  ['GET', '/api/users/profile'],
  ['PUT', '/api/users/profile'],
  ['PUT', '/api/users/change-password'],
  ['GET', '/api/books'],
  ['GET', '/api/books/book-123'],
  ['POST', '/api/books'],
  ['PUT', '/api/books/book-123'],
  ['DELETE', '/api/books/book-123'],
  ['POST', '/api/orders'],
  ['GET', '/api/orders/order-123'],
  ['GET', '/api/orders/user/user-123'],
  ['GET', '/api/admin/users'],
  ['GET', '/api/admin/books'],
  ['GET', '/api/admin/orders'],
  ['PATCH', '/api/admin/orders/order-123/status'],
  ['GET', '/api/reports/sales'],
  ['GET', '/api/reports/orders'],
  ['GET', '/api/reports/inventory'],
];

test('route table covers the documented endpoint surface', () => {
  assert.ok(ROUTES.length >= EXPECTED_ROUTES.length);

  for (const [method, path] of EXPECTED_ROUTES) {
    const match = matchRoute(method, path, '/api');
    assert.ok(match, `expected route for ${method} ${path}`);
    assert.equal(match.method, method);
  }
});

test('route matcher extracts path parameters', () => {
  const bookRoute = matchRoute('GET', '/api/books/book-123', '/api');
  assert.deepEqual(bookRoute.params, { bookId: 'book-123' });

  const orderRoute = matchRoute('PATCH', '/api/admin/orders/order-456/status', '/api');
  assert.deepEqual(orderRoute.params, { orderId: 'order-456' });
});

test('route matcher rejects unknown routes', () => {
  assert.equal(matchRoute('POST', '/api/unknown', '/api'), null);
});
