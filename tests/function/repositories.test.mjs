import test from 'node:test';
import assert from 'node:assert/strict';

import { createBookRepository } from '../../appwrite/functions/bookstore-api/src/repositories/books.js';
import { createOrderRepository } from '../../appwrite/functions/bookstore-api/src/repositories/orders.js';
import { createProfileRepository } from '../../appwrite/functions/bookstore-api/src/repositories/profiles.js';

function createTable(rows = []) {
  const state = new Map(rows.map(row => [row.$id, { ...row }]));

  return {
    async listAll() {
      return [...state.values()].map(row => ({ ...row }));
    },

    async get(rowId) {
      const row = state.get(rowId);
      return row ? { ...row } : null;
    },

    async create({ rowId, data }) {
      if (state.has(rowId)) {
        const error = new Error('duplicate row id');
        error.code = 409;
        throw error;
      }

      const row = { $id: rowId, ...data };
      state.set(rowId, row);
      return { ...row };
    },

    async update({ rowId, data }) {
      const current = state.get(rowId);
      if (!current) {
        return null;
      }

      const row = { ...current, ...data };
      state.set(rowId, row);
      return { ...row };
    },

    async delete(rowId) {
      return state.delete(rowId);
    },

    async decrementNumberField({ rowId, field, amount, updatedAt }) {
      const current = state.get(rowId);
      if (!current) {
        return null;
      }

      const row = {
        ...current,
        [field]: Number(current[field] ?? 0) - amount,
        updatedAt,
      };
      state.set(rowId, row);
      return { ...row };
    },

    async incrementNumberField({ rowId, field, amount, updatedAt }) {
      const current = state.get(rowId);
      if (!current) {
        return null;
      }

      const row = {
        ...current,
        [field]: Number(current[field] ?? 0) + amount,
        updatedAt,
      };
      state.set(rowId, row);
      return { ...row };
    },

    dump(rowId) {
      return state.get(rowId);
    },
  };
}

test('book repository lists normalized books and preserves stock rollback helpers', async () => {
  const table = createTable([
    {
      $id: 'book-1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      stock: 5,
      category: 'Fiction',
      isFeatured: true,
      createdAt: '2026-06-16T10:00:00.000Z',
      updatedAt: '2026-06-16T10:00:00.000Z',
    },
    {
      $id: 'book-2',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      stock: 3,
      category: 'Programming',
      isFeatured: false,
      createdAt: '2026-06-15T10:00:00.000Z',
      updatedAt: '2026-06-15T10:00:00.000Z',
    },
  ]);
  const repository = createBookRepository(table);

  const fictionBooks = await repository.list({ search: 'gatsby', category: 'Fiction' });

  assert.equal(fictionBooks.length, 1);
  assert.equal(fictionBooks[0].id, 'book-1');

  await repository.reserveStock([{ bookId: 'book-1', quantity: 2 }]);
  assert.equal(table.dump('book-1').stock, 3);

  await repository.releaseStock([{ bookId: 'book-1', quantity: 2 }]);
  assert.equal(table.dump('book-1').stock, 5);
});

test('order repository creates, lists, and updates normalized orders', async () => {
  const table = createTable([]);
  const repository = createOrderRepository(table);

  await repository.create({
    id: 'order-1',
    userId: 'user-1',
    items: [{ bookId: 'book-1', quantity: 2, price: 14.39 }],
    totalAmount: 10.5,
    status: 'pending',
    shippingAddressEncrypted: '{"value":"cipher"}',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    trackingNumber: 'TRK123',
    estimatedDelivery: '2026-06-22T10:00:00.000Z',
  });

  const byId = await repository.getById('order-1');
  const byUser = await repository.listByUserId('user-1');
  const updated = await repository.updateStatus('order-1', 'processing');

  assert.equal(typeof table.dump('order-1').items, 'string');
  assert.equal(byId.id, 'order-1');
  assert.equal(byId.items[0].bookId, 'book-1');
  assert.equal(byUser.length, 1);
  assert.equal(updated.status, 'processing');
});

test('profile repository upserts rows keyed by user id and lists by user ids', async () => {
  const table = createTable([]);
  const repository = createProfileRepository(table);

  await repository.upsert({
    userId: 'user-1',
    phone: '+15555550123',
    addressEncrypted: '{"value":"cipher"}',
    updatedAt: '2026-06-16T10:00:00.000Z',
  });

  const profile = await repository.getByUserId('user-1');
  const profiles = await repository.listByUserIds(['user-1', 'user-2']);

  assert.equal(profile.userId, 'user-1');
  assert.equal(profile.phone, '+15555550123');
  assert.equal(profiles.length, 1);
});
