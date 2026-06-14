import test from 'node:test';
import assert from 'node:assert/strict';

import { createBookHandlers } from '../../appwrite/functions/bookstore-api/src/handlers/books.js';

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
        createdAt: '2026-06-14T10:00:00.000Z',
        updatedAt: '2026-06-14T10:00:00.000Z',
      },
    ],
  };

  return {
    state,
    books: {
      async list({ search, category }) {
        return state.books.filter(book => {
          const matchesSearch = !search
            || book.title.toLowerCase().includes(search.toLowerCase())
            || book.author.toLowerCase().includes(search.toLowerCase());
          const matchesCategory = !category || category === 'all' || book.category === category;
          return matchesSearch && matchesCategory;
        });
      },
      async getById(bookId) {
        return state.books.find(book => book.id === bookId) ?? null;
      },
      async create(book) {
        state.books.unshift(book);
        return book;
      },
      async update(bookId, updates) {
        const index = state.books.findIndex(book => book.id === bookId);
        state.books[index] = { ...state.books[index], ...updates };
        return state.books[index];
      },
      async delete(bookId) {
        const before = state.books.length;
        state.books = state.books.filter(book => book.id !== bookId);
        return before !== state.books.length;
      },
    },
    clock: {
      nowIso() {
        return '2026-06-14T11:00:00.000Z';
      },
    },
    ids: {
      create(prefix) {
        return `${prefix}-generated`;
      },
    },
  };
}

test('list books filters by search and category', async () => {
  const services = createServices();
  const handlers = createBookHandlers(services);

  const response = await handlers.list({
    request: {
      query: {
        search: 'gatsby',
        category: 'Fiction',
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].$id, 'book-1');
});

test('get book returns a 404 when the record does not exist', async () => {
  const services = createServices();
  const handlers = createBookHandlers(services);

  await assert.rejects(
    handlers.get({ params: { bookId: 'missing-book' } }),
    /Book not found/,
  );
});

test('create book returns the created catalog record', async () => {
  const services = createServices();
  const handlers = createBookHandlers(services);

  const response = await handlers.create({
    request: {
      bodyJson: {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9780441013593',
        price: 19.99,
        stock: 12,
        description: 'Science fiction classic',
        category: 'Science Fiction',
        publishedYear: 1965,
      },
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.$id, 'book-generated');
  assert.equal(response.body.title, 'Dune');
});

test('update book applies partial updates', async () => {
  const services = createServices();
  const handlers = createBookHandlers(services);

  const response = await handlers.update({
    params: { bookId: 'book-1' },
    request: {
      bodyJson: {
        stock: 3,
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.stock, 3);
});

test('delete book returns 204 for an existing book', async () => {
  const services = createServices();
  const handlers = createBookHandlers(services);

  const response = await handlers.delete({
    params: { bookId: 'book-1' },
  });

  assert.equal(response.statusCode, 204);
  assert.equal(services.state.books.length, 0);
});
