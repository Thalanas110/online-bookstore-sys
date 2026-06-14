import { HttpError } from '../errors.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeBook(document) {
  if (!document) {
    return null;
  }

  const { _id, id: _ignored, ...rest } = document;
  return {
    id: String(_id),
    ...rest,
  };
}

function toDuplicateBookError() {
  return new HttpError(409, 'conflict', 'A book with this ISBN already exists');
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

export function createBookRepository(database) {
  const collection = database.collection('books');

  return {
    async list({ search, category } = {}) {
      const filter = {};

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (search) {
        const pattern = escapeRegExp(search.trim());
        filter.$or = [
          { title: { $regex: pattern, $options: 'i' } },
          { author: { $regex: pattern, $options: 'i' } },
          { isbn: { $regex: pattern, $options: 'i' } },
          { category: { $regex: pattern, $options: 'i' } },
        ];
      }

      const documents = await collection
        .find(filter)
        .sort({ isFeatured: -1, updatedAt: -1, createdAt: -1, title: 1 })
        .toArray();

      return documents.map(normalizeBook);
    },

    async getById(bookId) {
      return normalizeBook(await collection.findOne({ _id: bookId }));
    },

    async getRawById(bookId) {
      return normalizeBook(await collection.findOne({ _id: bookId }));
    },

    async create(book) {
      try {
        const { id, ...document } = book;
        await collection.insertOne({
          _id: id,
          ...document,
        });
        return book;
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw toDuplicateBookError();
        }

        throw error;
      }
    },

    async update(bookId, updates) {
      try {
        const updated = await collection.findOneAndUpdate(
          { _id: bookId },
          { $set: updates },
          {
            returnDocument: 'after',
            includeResultMetadata: false,
          },
        );

        return normalizeBook(updated);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw toDuplicateBookError();
        }

        throw error;
      }
    },

    async delete(bookId) {
      const result = await collection.deleteOne({ _id: bookId });
      return result.deletedCount === 1;
    },

    async reserveStock(items) {
      const reserved = [];

      try {
        for (const item of items) {
          const updated = await collection.findOneAndUpdate(
            {
              _id: item.bookId,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
              $set: { updatedAt: new Date().toISOString() },
            },
            {
              returnDocument: 'after',
              includeResultMetadata: false,
            },
          );

          if (!updated) {
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
        items.map(item => collection.updateOne(
          { _id: item.bookId },
          {
            $inc: { stock: item.quantity },
            $set: { updatedAt: new Date().toISOString() },
          },
        )),
      );
    },
  };
}
