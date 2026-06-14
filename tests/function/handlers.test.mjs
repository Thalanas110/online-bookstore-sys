import test from 'node:test';
import assert from 'node:assert/strict';

import { encryptString, decryptString, serializeEncryptedField } from '../../appwrite/functions/bookstore-api/src/crypto.js';
import { createAuthHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/auth.js';
import { createUserHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/users.js';
import { createOrderHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/orders.js';
import { createAdminHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/admin.js';
import { createReportHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/reports.js';

const AES_KEY = Buffer.alloc(32, 11);

function createServices() {
  const state = {
    books: [
      {
        id: 'book-1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        price: 15.99,
        stock: 5,
        description: 'Classic novel',
        category: 'Fiction',
        publishedYear: 1925,
        imageUrl: 'https://example.com/gatsby.jpg',
        rating: 4.2,
        reviewCount: 4821,
        isFeatured: true,
        isBestseller: true,
        isNew: false,
        discount: 10,
      },
    ],
    profiles: new Map(),
    orders: [],
    users: [
      { $id: 'user-1', name: 'Reader One', email: 'reader@example.com', prefs: { role: 'user' } },
      { $id: 'admin-1', name: 'Admin One', email: 'admin@example.com', prefs: { role: 'admin' } },
    ],
  };

  return {
    state,
    appwrite: {
      async createUser({ email, password, name }) {
        assert.equal(password, 'password123');
        const user = { $id: 'user-created', email, name, prefs: { role: 'user' } };
        state.users.push(user);
        return user;
      },
      async createEmailPasswordSession({ email, password }) {
        assert.equal(email, 'reader@example.com');
        assert.equal(password, 'password123');
        return {
          $id: 'session-1',
          secret: 'session-secret',
          expire: '2026-06-15T00:00:00.000Z',
        };
      },
      async getUserFromSessionSecret() {
        return state.users[0];
      },
      async getUserFromJwt() {
        return state.users[0];
      },
      async updateUserName({ name }) {
        state.users[0] = { ...state.users[0], name };
        return state.users[0];
      },
      async updatePassword({ oldPassword, newPassword }) {
        assert.equal(oldPassword, 'old-password');
        assert.equal(newPassword, 'new-password-123');
      },
      async deleteCurrentSession() {
        return undefined;
      },
      async listUsers() {
        return state.users;
      },
    },
    profiles: {
      async getByUserId(userId) {
        return state.profiles.get(userId) ?? null;
      },
      async upsert(profile) {
        state.profiles.set(profile.userId, profile);
        return profile;
      },
      async listByUserIds(userIds) {
        return userIds
          .map(userId => state.profiles.get(userId))
          .filter(Boolean);
      },
    },
    books: {
      async list() {
        return state.books.map(book => ({ ...book }));
      },
      async getRawById(bookId) {
        return state.books.find(book => book.id === bookId) ?? null;
      },
      async reserveStock(items) {
        for (const item of items) {
          const book = state.books.find(entry => entry.id === item.bookId);
          if (!book || book.stock < item.quantity) {
            throw new Error('Insufficient stock');
          }
        }

        for (const item of items) {
          const book = state.books.find(entry => entry.id === item.bookId);
          book.stock -= item.quantity;
        }
      },
    },
    orders: {
      async create(order) {
        state.orders.unshift(order);
        return order;
      },
      async getById(orderId) {
        return state.orders.find(order => order.id === orderId) ?? null;
      },
      async listByUserId(userId) {
        return state.orders.filter(order => order.userId === userId);
      },
      async listAll() {
        return [...state.orders];
      },
      async updateStatus(orderId, status) {
        const order = state.orders.find(entry => entry.id === orderId);
        order.status = status;
        order.updatedAt = '2026-06-14T12:00:00.000Z';
        return order;
      },
    },
    crypto: {
      encrypt(plaintext) {
        return encryptString(plaintext, AES_KEY);
      },
      decrypt(payload) {
        return decryptString(payload, AES_KEY);
      },
      serialize(payload) {
        return serializeEncryptedField(payload);
      },
    },
    clock: {
      nowIso() {
        return '2026-06-14T10:00:00.000Z';
      },
    },
    ids: {
      create(prefix) {
        return `${prefix}-generated`;
      },
      trackingNumber() {
        return 'TRKTEST1234';
      },
    },
  };
}

test('register handler creates a user and returns public user fields', async () => {
  const services = createServices();
  const handlers = createAuthHandlers(services);

  const response = await handlers.register({
    request: {
      bodyJson: {
        email: 'reader@example.com',
        password: 'password123',
        name: 'Reader One',
      },
    },
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    $id: 'user-created',
    email: 'reader@example.com',
    name: 'Reader One',
    role: 'user',
  });
});

test('profile update handler encrypts address at rest and returns plaintext to the client', async () => {
  const services = createServices();
  const handlers = createUserHandlers(services);

  const response = await handlers.updateProfile({
    auth: { user: services.state.users[0], jwt: 'jwt-token' },
    request: {
      headers: { 'user-agent': 'PageTurnTest/1.0' },
      bodyJson: {
        name: 'Reader Updated',
        phone: '+15555550123',
        address: '123 Main St',
      },
    },
  });

  const storedProfile = services.state.profiles.get('user-1');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.name, 'Reader Updated');
  assert.equal(response.body.phone, '+15555550123');
  assert.equal(response.body.address, '123 Main St');
  assert.ok(storedProfile.addressEncrypted);
  assert.notEqual(storedProfile.addressEncrypted, '123 Main St');
});

test('change password handler delegates to Appwrite with the current JWT context', async () => {
  const services = createServices();
  const handlers = createUserHandlers(services);

  const response = await handlers.changePassword({
    auth: { user: services.state.users[0], jwt: 'jwt-token' },
    request: {
      headers: { 'user-agent': 'PageTurnTest/1.0' },
      bodyJson: {
        oldPassword: 'old-password',
        newPassword: 'new-password-123',
      },
    },
  });

  assert.equal(response.statusCode, 204);
});

test('create order handler ignores client pricing, decrements stock, and encrypts shipping address', async () => {
  const services = createServices();
  const handlers = createOrderHandlers(services);

  const response = await handlers.create({
    auth: { user: services.state.users[0], jwt: 'jwt-token' },
    request: {
      bodyJson: {
        items: [
          {
            bookId: 'book-1',
            quantity: 2,
            price: 0.01,
          },
        ],
        shippingAddress: '456 Oak Ave',
      },
    },
  });

  const storedOrder = services.state.orders[0];

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.totalAmount, 28.78);
  assert.equal(response.body.status, 'pending');
  assert.equal(response.body.shippingAddress, '456 Oak Ave');
  assert.equal(response.body.trackingNumber, 'TRKTEST1234');
  assert.equal(services.state.books[0].stock, 3);
  assert.notEqual(storedOrder.shippingAddressEncrypted, '456 Oak Ave');
  assert.equal(storedOrder.items[0].price, 14.39);
  assert.equal(storedOrder.items[0].bookTitle, 'The Great Gatsby');
});

test('create order handler restores stock when persistence fails after reservation', async () => {
  const services = createServices();
  services.orders.create = async () => {
    throw new Error('Database write failed');
  };
  services.books.releaseStock = async items => {
    for (const item of items) {
      const book = services.state.books.find(entry => entry.id === item.bookId);
      book.stock += item.quantity;
    }
  };
  const handlers = createOrderHandlers(services);

  await assert.rejects(
    handlers.create({
      auth: { user: services.state.users[0], jwt: 'jwt-token' },
      request: {
        bodyJson: {
          items: [
            {
              bookId: 'book-1',
              quantity: 2,
            },
          ],
          shippingAddress: '456 Oak Ave',
        },
      },
    }),
    /Database write failed/,
  );

  assert.equal(services.state.books[0].stock, 5);
});

test('admin order status handler updates order status', async () => {
  const services = createServices();
  services.state.orders.push({
    id: 'order-1',
    userId: 'user-1',
    items: [],
    totalAmount: 15.99,
    status: 'pending',
    shippingAddressEncrypted: serializeEncryptedField(encryptString('123 Main St', AES_KEY)),
    createdAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-14T10:00:00.000Z',
    trackingNumber: 'TRKOLD123',
    estimatedDelivery: '2026-06-20T10:00:00.000Z',
  });
  const handlers = createAdminHandlers(services);

  const response = await handlers.updateOrderStatus({
    auth: { user: services.state.users[1], jwt: 'admin-jwt' },
    params: { orderId: 'order-1' },
    request: {
      bodyJson: {
        status: 'processing',
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'processing');
});

test('report handlers aggregate sales, orders, and inventory fields', async () => {
  const services = createServices();
  services.state.orders.push({
    id: 'order-1',
    userId: 'user-1',
    items: [
      {
        bookId: 'book-1',
        bookTitle: 'The Great Gatsby',
        quantity: 2,
        price: 15.99,
      },
    ],
    totalAmount: 31.98,
    status: 'completed',
    shippingAddressEncrypted: serializeEncryptedField(encryptString('123 Main St', AES_KEY)),
    createdAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-14T10:00:00.000Z',
    trackingNumber: 'TRKOLD123',
    estimatedDelivery: '2026-06-20T10:00:00.000Z',
  });

  const handlers = createReportHandlers(services);
  const sales = await handlers.sales({ request: { query: {} } });
  const orders = await handlers.orders({ request: { query: {} } });
  const inventory = await handlers.inventory({ request: { query: {} } });

  assert.equal(sales.statusCode, 200);
  assert.equal(sales.body.totalSales, 31.98);
  assert.equal(sales.body.totalOrders, 1);
  assert.equal(sales.body.topSellingBooks[0].bookId, 'book-1');

  assert.equal(orders.statusCode, 200);
  assert.equal(orders.body.totalOrders, 1);
  assert.equal(orders.body.ordersByStatus.completed, 1);

  assert.equal(inventory.statusCode, 200);
  assert.equal(inventory.body.totalBooks, 1);
  assert.equal(Array.isArray(inventory.body.lowStock), true);
  assert.equal(Array.isArray(inventory.body.outOfStock), true);
});
