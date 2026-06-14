import { randomUUID } from 'node:crypto';

import { deserializeEncryptedField, decryptString, encryptString, serializeEncryptedField } from './crypto.js';
import { createAdminHandlers } from './handlers/admin.js';
import { createAuthHandlers } from './handlers/auth.js';
import { createBookHandlers } from './handlers/books.js';
import { createOrderHandlers } from './handlers/orders.js';
import { createReportHandlers } from './handlers/reports.js';
import { createUserHandlers } from './handlers/users.js';
import { createBookRepository } from './repositories/books.js';
import { createOrderRepository } from './repositories/orders.js';
import { createProfileRepository } from './repositories/profiles.js';

function createTrackingNumber() {
  return `TRK${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

function createCryptoService(aesKey) {
  return {
    encrypt(plaintext) {
      return encryptString(plaintext, aesKey);
    },

    decrypt(payload) {
      return decryptString(deserializeEncryptedField(payload), aesKey);
    },

    serialize(payload) {
      return serializeEncryptedField(payload);
    },
  };
}

function createRouteHandlerMap(services) {
  const authHandlers = createAuthHandlers(services);
  const userHandlers = createUserHandlers(services);
  const bookHandlers = createBookHandlers(services);
  const orderHandlers = createOrderHandlers(services);
  const adminHandlers = createAdminHandlers(services);
  const reportHandlers = createReportHandlers(services);

  return {
    'auth.register': authHandlers.register,
    'auth.login': authHandlers.login,
    'auth.logout': authHandlers.logout,
    'auth.me': authHandlers.me,
    'users.getProfile': userHandlers.getProfile,
    'users.updateProfile': userHandlers.updateProfile,
    'users.changePassword': userHandlers.changePassword,
    'books.list': bookHandlers.list,
    'books.get': bookHandlers.get,
    'books.create': bookHandlers.create,
    'books.update': bookHandlers.update,
    'books.delete': bookHandlers.delete,
    'orders.create': orderHandlers.create,
    'orders.get': orderHandlers.get,
    'orders.listUser': orderHandlers.listUser,
    'admin.listUsers': adminHandlers.listUsers,
    'admin.listBooks': adminHandlers.listBooks,
    'admin.listOrders': adminHandlers.listOrders,
    'admin.updateOrderStatus': adminHandlers.updateOrderStatus,
    'reports.sales': reportHandlers.sales,
    'reports.orders': reportHandlers.orders,
    'reports.inventory': reportHandlers.inventory,
  };
}

export function createRouteHandlers({ appwrite, config, database }) {
  const services = {
    appwrite,
    books: createBookRepository(database),
    orders: createOrderRepository(database),
    profiles: createProfileRepository(database),
    crypto: createCryptoService(config.aesKey),
    clock: {
      nowIso() {
        return new Date().toISOString();
      },
    },
    ids: {
      create(prefix) {
        return `${prefix}_${randomUUID().replace(/-/g, '')}`;
      },
      trackingNumber: createTrackingNumber,
    },
  };

  return createRouteHandlerMap(services);
}
