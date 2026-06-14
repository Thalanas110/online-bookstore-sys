function normalizeProfile(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return rest;
}

export function createProfileRepository(database) {
  const collection = database.collection('profiles');

  return {
    async getByUserId(userId) {
      return normalizeProfile(await collection.findOne({ userId }));
    },

    async upsert(profile) {
      const updated = await collection.findOneAndUpdate(
        { userId: profile.userId },
        {
          $set: {
            userId: profile.userId,
            phone: profile.phone,
            addressEncrypted: profile.addressEncrypted,
            updatedAt: profile.updatedAt,
          },
          $setOnInsert: {
            createdAt: profile.updatedAt,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          includeResultMetadata: false,
        },
      );

      return normalizeProfile(updated);
    },

    async listByUserIds(userIds) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      const documents = await collection.find({
        userId: {
          $in: userIds,
        },
      }).toArray();

      return documents.map(normalizeProfile);
    },
  };
}
