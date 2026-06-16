import { HttpError } from '../errors.js';

function normalizeRow(row) {
  if (!row) {
    return null;
  }

  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith('$')) {
      normalized[key] = value;
    }
  }

  return {
    id: String(row.$id ?? row.id),
    ...normalized,
  };
}

function normalizeSearchValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function toDuplicateBookError() {
  return new HttpError(409, 'conflict', 'A book with this ISBN already exists');
}

function isConflictError(error) {
  return Number(error?.code) === 409;
}

function bookSort(left, right) {
  return (
    Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured))
    || String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? ''))
    || String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? ''))
    || String(left.title ?? '').localeCompare(String(right.title ?? ''))
  );
}

export function createBookRepository(table) {
  return {
    async list({ search, category } = {}) {
      const searchValue = normalizeSearchValue(search);
      const categoryValue = normalizeSearchValue(category);
      const rows = await table.listAll();
      const books = rows.map(normalizeRow);

      return books
        .filter(book => {
          if (categoryValue && categoryValue !== 'all' && normalizeSearchValue(book.category) !== categoryValue) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          return [
            book.title,
            book.author,
            book.isbn,
            book.category,
          ].some(field => normalizeSearchValue(field).includes(searchValue));
        })
        .sort(bookSort);
    },

    async getById(bookId) {
      return normalizeRow(await table.get(bookId));
    },

    async getRawById(bookId) {
      return normalizeRow(await table.get(bookId));
    },

    async create(book) {
      try {
        const { id, ...document } = book;
        const created = await table.create({
          rowId: id,
          data: document,
        });
        return normalizeRow(created);
      } catch (error) {
        if (isConflictError(error)) {
          throw toDuplicateBookError();
        }

        throw error;
      }
    },

    async update(bookId, updates) {
      try {
        return normalizeRow(await table.update({
          rowId: bookId,
          data: updates,
        }));
      } catch (error) {
        if (isConflictError(error)) {
          throw toDuplicateBookError();
        }

        throw error;
      }
    },

    async delete(bookId) {
      return table.delete(bookId);
    },

    async reserveStock(items) {
      const reserved = [];

      try {
        for (const item of items) {
          const updatedAt = new Date().toISOString();
          const updated = await table.decrementNumberField({
            rowId: item.bookId,
            field: 'stock',
            amount: item.quantity,
            updatedAt,
          });

          if (!updated) {
            throw new HttpError(409, 'conflict', `Insufficient stock for book: ${item.bookId}`);
          }

          if (Number(updated.stock) < 0) {
            await table.incrementNumberField({
              rowId: item.bookId,
              field: 'stock',
              amount: item.quantity,
              updatedAt: new Date().toISOString(),
            });
            throw new HttpError(409, 'conflict', `Insufficient stock for book: ${item.bookId}`);
          }

          reserved.push(item);
        }
      } catch (error) {
        if (reserved.length > 0) {
          await this.releaseStock(reserved);
        }

        throw error;
      }
    },

    async releaseStock(items) {
      await Promise.all(
        items.map(item => table.incrementNumberField({
          rowId: item.bookId,
          field: 'stock',
          amount: item.quantity,
          updatedAt: new Date().toISOString(),
        })),
      );
    },
  };
}
