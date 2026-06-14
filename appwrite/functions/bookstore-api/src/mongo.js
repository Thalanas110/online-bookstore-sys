import { MongoClient } from 'mongodb';

let databasePromise;

async function ensureIndexes(database) {
  await Promise.all([
    database.collection('books').createIndex({ isbn: 1 }, { unique: true, name: 'uniq_books_isbn' }),
    database.collection('books').createIndex({ category: 1, updatedAt: -1 }, { name: 'books_category_updatedAt' }),
    database.collection('orders').createIndex({ userId: 1, createdAt: -1 }, { name: 'orders_user_createdAt' }),
    database.collection('orders').createIndex({ status: 1, createdAt: -1 }, { name: 'orders_status_createdAt' }),
    database.collection('profiles').createIndex({ userId: 1 }, { unique: true, name: 'uniq_profiles_userId' }),
  ]);
}

async function connect(config) {
  const client = new MongoClient(config.mongoUri, {
    maxPoolSize: 20,
    minPoolSize: 0,
    retryWrites: true,
  });

  await client.connect();
  const database = client.db(config.mongoDbName);
  await ensureIndexes(database);
  return database;
}

export async function getMongoDatabase(config) {
  if (!databasePromise) {
    databasePromise = connect(config);
  }

  return databasePromise;
}
