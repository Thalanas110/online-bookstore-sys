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
    items: parseOrderItems(normalized.items),
  };
}

function parseOrderItems(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeOrderDocument(order) {
  const { items, ...rest } = order;
  return {
    ...rest,
    items: JSON.stringify(Array.isArray(items) ? items : []),
  };
}

function orderSort(left, right) {
  return (
    String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? ''))
    || String(right.id ?? '').localeCompare(String(left.id ?? ''))
  );
}

export function createOrderRepository(table) {
  return {
    async create(order) {
      const { id, ...document } = serializeOrderDocument(order);
      const created = await table.create({
        rowId: id,
        data: document,
      });

      return normalizeRow(created);
    },

    async getById(orderId) {
      return normalizeRow(await table.get(orderId));
    },

    async listByUserId(userId) {
      const rows = await table.listAll();
      return rows
        .map(normalizeRow)
        .filter(order => order.userId === userId)
        .sort(orderSort);
    },

    async listAll() {
      const rows = await table.listAll();
      return rows
        .map(normalizeRow)
        .sort(orderSort);
    },

    async updateStatus(orderId, status) {
      return normalizeRow(await table.update({
        rowId: orderId,
        data: {
          status,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
  };
}
