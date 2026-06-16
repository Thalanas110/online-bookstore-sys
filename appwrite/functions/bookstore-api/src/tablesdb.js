function createBaseClient(config, Client) {
  return new Client()
    .setEndpoint(config.appwriteEndpoint)
    .setProject(config.appwriteProjectId)
    .setKey(config.appwriteApiKey);
}

function isNotFoundError(error) {
  return Number(error?.code) === 404;
}

function readRows(response) {
  if (Array.isArray(response?.rows)) {
    return response.rows;
  }

  if (Array.isArray(response?.documents)) {
    return response.documents;
  }

  return [];
}

function createTableGateway({ tablesDB, databaseId, tableId, Query, Operator }) {
  return {
    async listAll() {
      const rows = [];
      const pageSize = 100;
      let cursorAfter;

      while (true) {
        const queries = [Query.limit(pageSize)];
        if (cursorAfter) {
          queries.push(Query.cursorAfter(cursorAfter));
        }

        const response = await tablesDB.listRows({
          databaseId,
          tableId,
          queries,
        });
        const page = readRows(response);

        rows.push(...page);

        if (page.length < pageSize) {
          break;
        }

        const lastRow = page[page.length - 1];
        if (!lastRow?.$id) {
          break;
        }

        cursorAfter = lastRow.$id;
      }

      return rows;
    },

    async get(rowId) {
      try {
        return await tablesDB.getRow({
          databaseId,
          tableId,
          rowId,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },

    async create({ rowId, data }) {
      return tablesDB.createRow({
        databaseId,
        tableId,
        rowId,
        data,
      });
    },

    async update({ rowId, data }) {
      try {
        return await tablesDB.updateRow({
          databaseId,
          tableId,
          rowId,
          data,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },

    async delete(rowId) {
      try {
        await tablesDB.deleteRow({
          databaseId,
          tableId,
          rowId,
        });
        return true;
      } catch (error) {
        if (isNotFoundError(error)) {
          return false;
        }

        throw error;
      }
    },

    async decrementNumberField({ rowId, field, amount, updatedAt }) {
      try {
        return await tablesDB.updateRow({
          databaseId,
          tableId,
          rowId,
          data: {
            [field]: Operator.decrement(amount),
            updatedAt,
          },
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },

    async incrementNumberField({ rowId, field, amount, updatedAt }) {
      try {
        return await tablesDB.updateRow({
          databaseId,
          tableId,
          rowId,
          data: {
            [field]: Operator.increment(amount),
            updatedAt,
          },
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },
  };
}

async function resolveSdk(sdk) {
  if (sdk) {
    return sdk;
  }

  return import('node-appwrite');
}

export async function createTablesDatabase(config, sdk) {
  const { Client, TablesDB, Query, Operator } = await resolveSdk(sdk);
  const client = createBaseClient(config, Client);
  const tablesDB = new TablesDB(client);

  return {
    books: createTableGateway({
      tablesDB,
      databaseId: config.appwriteDatabaseId,
      tableId: config.appwriteBooksTableId,
      Query,
      Operator,
    }),
    orders: createTableGateway({
      tablesDB,
      databaseId: config.appwriteDatabaseId,
      tableId: config.appwriteOrdersTableId,
      Query,
      Operator,
    }),
    profiles: createTableGateway({
      tablesDB,
      databaseId: config.appwriteDatabaseId,
      tableId: config.appwriteProfilesTableId,
      Query,
      Operator,
    }),
  };
}
