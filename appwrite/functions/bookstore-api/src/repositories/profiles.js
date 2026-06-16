function normalizeRow(row) {
  if (!row) {
    return null;
  }

  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith('$') && key !== 'id') {
      normalized[key] = value;
    }
  }

  return normalized;
}

export function createProfileRepository(table) {
  return {
    async getByUserId(userId) {
      return normalizeRow(await table.get(userId));
    },

    async upsert(profile) {
      const document = {
        userId: profile.userId,
        phone: profile.phone,
        addressEncrypted: profile.addressEncrypted,
        updatedAt: profile.updatedAt,
      };
      const existing = await table.get(profile.userId);

      if (existing) {
        return normalizeRow(await table.update({
          rowId: profile.userId,
          data: document,
        }));
      }

      return normalizeRow(await table.create({
        rowId: profile.userId,
        data: {
          ...document,
          createdAt: profile.updatedAt,
        },
      }));
    },

    async listByUserIds(userIds) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      const allowedUserIds = new Set(userIds);
      const rows = await table.listAll();

      return rows
        .map(normalizeRow)
        .filter(profile => allowedUserIds.has(profile.userId));
    },
  };
}
