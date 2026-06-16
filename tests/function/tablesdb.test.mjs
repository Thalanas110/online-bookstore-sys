import test from 'node:test';
import assert from 'node:assert/strict';

import { createTablesDatabase } from '../../appwrite/functions/bookstore-api/src/tablesdb.js';

class FakeClient {
  setEndpoint(endpoint) {
    this.endpoint = endpoint;
    return this;
  }

  setProject(projectId) {
    this.projectId = projectId;
    return this;
  }

  setKey(key) {
    this.key = key;
    return this;
  }
}

class FakeTablesDB {
  constructor(client) {
    this.client = client;
    this.rows = new Map([
      ['books:book-1', { $id: 'book-1', title: 'The Great Gatsby', stock: 5 }],
    ]);
    this.listCalls = 0;
  }

  async listRows({ databaseId, tableId }) {
    this.listCalls += 1;
    assert.equal(databaseId, 'bookstore-db');
    assert.equal(tableId, 'books');
    return {
      rows: this.listCalls === 1
        ? [{ $id: 'book-1', title: 'The Great Gatsby', stock: 5 }]
        : [],
    };
  }

  async getRow({ tableId, rowId }) {
    const row = this.rows.get(`${tableId}:${rowId}`);
    if (!row) {
      const error = new Error('missing');
      error.code = 404;
      throw error;
    }

    return { ...row };
  }

  async updateRow({ tableId, rowId, data }) {
    const current = this.rows.get(`${tableId}:${rowId}`);
    const row = { ...current, ...data };
    this.rows.set(`${tableId}:${rowId}`, row);
    return { ...row };
  }
}

test('createTablesDatabase builds Appwrite-backed table gateways', async () => {
  const database = await createTablesDatabase({
    appwriteEndpoint: 'https://example.appwrite.io/v1',
    appwriteProjectId: 'bookstore-project',
    appwriteApiKey: 'secret',
    appwriteDatabaseId: 'bookstore-db',
    appwriteBooksTableId: 'books',
    appwriteOrdersTableId: 'orders',
    appwriteProfilesTableId: 'profiles',
  }, {
    Client: FakeClient,
    TablesDB: FakeTablesDB,
    Query: {
      limit(value) {
        return `limit(${value})`;
      },
      cursorAfter(value) {
        return `cursorAfter(${value})`;
      },
    },
    Operator: {
      decrement(value) {
        return { kind: 'decrement', value };
      },
      increment(value) {
        return { kind: 'increment', value };
      },
    },
  });

  const rows = await database.books.listAll();
  const row = await database.books.get('book-1');
  const updated = await database.books.decrementNumberField({
    rowId: 'book-1',
    field: 'stock',
    amount: 2,
    updatedAt: '2026-06-16T12:00:00.000Z',
  });

  assert.equal(rows.length, 1);
  assert.equal(row.title, 'The Great Gatsby');
  assert.deepEqual(updated.stock, { kind: 'decrement', value: 2 });
});
