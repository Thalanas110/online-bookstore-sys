import { HttpError } from '../errors.js';
import { toPublicBook, toPublicOrder, toPublicUser } from '../mappers.js';
import { validateOrderStatusUpdate } from '../validators.js';

function decryptAddress(services, addressEncrypted) {
  if (!addressEncrypted) {
    return undefined;
  }

  return services.crypto.decrypt(JSON.parse(addressEncrypted));
}

function buildBookSalesMetrics(orders) {
  const metrics = new Map();

  for (const order of orders) {
    if (order.status === 'cancelled') {
      continue;
    }

    for (const item of order.items) {
      const existing = metrics.get(item.bookId) ?? { totalSold: 0, revenue: 0 };
      existing.totalSold += item.quantity;
      existing.revenue += item.quantity * item.price;
      metrics.set(item.bookId, existing);
    }
  }

  return metrics;
}

export function createAdminHandlers(services) {
  return {
    async listUsers() {
      const users = await services.appwrite.listUsers();
      const profiles = await services.profiles.listByUserIds(users.map(user => user.$id));
      const profilesByUserId = new Map(profiles.map(profile => [profile.userId, profile]));

      return {
        statusCode: 200,
        noStore: true,
        body: users.map(user => {
          const profile = profilesByUserId.get(user.$id);
          return toPublicUser(user, profile, decryptAddress(services, profile?.addressEncrypted));
        }),
      };
    },

    async listBooks() {
      const [books, orders] = await Promise.all([
        services.books.list(),
        services.orders.listAll(),
      ]);
      const metrics = buildBookSalesMetrics(orders);

      return {
        statusCode: 200,
        body: books.map(book => {
          const sales = metrics.get(book.id) ?? { totalSold: 0, revenue: 0 };
          return {
            ...toPublicBook(book),
            totalSold: sales.totalSold,
            revenue: Math.round(sales.revenue * 100) / 100,
          };
        }),
      };
    },

    async listOrders() {
      const orders = await services.orders.listAll();
      return {
        statusCode: 200,
        noStore: true,
        body: orders.map(order => toPublicOrder(order, decryptAddress(services, order.shippingAddressEncrypted))),
      };
    },

    async updateOrderStatus({ params, request }) {
      const existing = await services.orders.getById(params.orderId);
      if (!existing) {
        throw new HttpError(404, 'not_found', 'Order not found');
      }

      const payload = validateOrderStatusUpdate(request.bodyJson);
      const updated = await services.orders.updateStatus(params.orderId, payload.status);

      return {
        statusCode: 200,
        noStore: true,
        body: toPublicOrder(updated, decryptAddress(services, updated.shippingAddressEncrypted)),
      };
    },
  };
}
