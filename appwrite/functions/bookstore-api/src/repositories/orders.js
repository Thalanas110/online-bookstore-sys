function normalizeOrder(document) {
  if (!document) {
    return null;
  }

  const { _id, id: _ignored, ...rest } = document;
  return {
    id: String(_id),
    ...rest,
  };
}

export function createOrderRepository(database) {
  const collection = database.collection('orders');

  return {
    async create(order) {
      const { id, ...document } = order;
      await collection.insertOne({
        _id: id,
        ...document,
      });

      return order;
    },

    async getById(orderId) {
      return normalizeOrder(await collection.findOne({ _id: orderId }));
    },

    async listByUserId(userId) {
      const documents = await collection
        .find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .toArray();

      return documents.map(normalizeOrder);
    },

    async listAll() {
      const documents = await collection
        .find({})
        .sort({ createdAt: -1, _id: -1 })
        .toArray();

      return documents.map(normalizeOrder);
    },

    async updateStatus(orderId, status) {
      const updated = await collection.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        {
          returnDocument: 'after',
          includeResultMetadata: false,
        },
      );

      return normalizeOrder(updated);
    },
  };
}
