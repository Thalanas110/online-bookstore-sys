import { HttpError } from '../errors.js';
import { toPublicBook } from '../mappers.js';
import { validateBookCreate, validateBookUpdate } from '../validators.js';

export function createBookHandlers(services) {
  return {
    async list({ request }) {
      const books = await services.books.list({
        search: request.query?.search,
        category: request.query?.category,
      });

      return {
        statusCode: 200,
        body: books.map(toPublicBook),
      };
    },

    async get({ params }) {
      const book = await services.books.getById(params.bookId);
      if (!book) {
        throw new HttpError(404, 'not_found', 'Book not found');
      }

      return {
        statusCode: 200,
        body: toPublicBook(book),
      };
    },

    async create({ request }) {
      const payload = validateBookCreate(request.bodyJson);
      const timestamp = services.clock.nowIso();
      const book = await services.books.create({
        id: services.ids.create('book'),
        ...payload,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return {
        statusCode: 201,
        body: toPublicBook(book),
      };
    },

    async update({ params, request }) {
      const existing = await services.books.getById(params.bookId);
      if (!existing) {
        throw new HttpError(404, 'not_found', 'Book not found');
      }

      const payload = validateBookUpdate(request.bodyJson);
      const updated = await services.books.update(params.bookId, {
        ...payload,
        updatedAt: services.clock.nowIso(),
      });

      return {
        statusCode: 200,
        body: toPublicBook(updated),
      };
    },

    async delete({ params }) {
      const deleted = await services.books.delete(params.bookId);
      if (!deleted) {
        throw new HttpError(404, 'not_found', 'Book not found');
      }

      return {
        statusCode: 204,
      };
    },
  };
}
