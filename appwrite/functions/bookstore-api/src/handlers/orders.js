import { HttpError } from '../errors.js';
import { getUserRole, toPublicOrder } from '../mappers.js';
import { validateOrderCreate, validateUserScopedAccess } from '../validators.js';

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function bookSalePrice(book) {
  if (typeof book.discount === 'number' && book.discount > 0) {
    return roundCurrency(book.price * (1 - book.discount / 100));
  }

  return roundCurrency(book.price);
}

function decryptAddress(services, addressEncrypted) {
  return services.crypto.decrypt(JSON.parse(addressEncrypted));
}

export function createOrderHandlers(services) {
  return {
    async create({ auth, request }) {
      const payload = validateOrderCreate(request.bodyJson);
      const rawBooks = await Promise.all(
        payload.items.map(item => services.books.getRawById(item.bookId)),
      );

      for (let index = 0; index < rawBooks.length; index += 1) {
        if (!rawBooks[index]) {
          throw new HttpError(404, 'not_found', `Book not found: ${payload.items[index].bookId}`);
        }
      }

      await services.books.reserveStock(payload.items);

      try {
        const items = payload.items.map((item, index) => {
          const book = rawBooks[index];
          const unitPrice = bookSalePrice(book);
          return {
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            imageUrl: book.imageUrl,
            quantity: item.quantity,
            price: unitPrice,
          };
        });

        const totalAmount = roundCurrency(
          items.reduce((total, item) => total + item.price * item.quantity, 0),
        );
        const shippingAddressEncrypted = services.crypto.serialize(
          services.crypto.encrypt(payload.shippingAddress),
        );
        const createdAt = services.clock.nowIso();
        const estimatedDelivery = new Date(Date.parse(createdAt) + (6 * 24 * 60 * 60 * 1000)).toISOString();

        const order = await services.orders.create({
          id: services.ids.create('order'),
          userId: auth.user.$id,
          items,
          totalAmount,
          status: 'pending',
          shippingAddressEncrypted,
          createdAt,
          updatedAt: createdAt,
          trackingNumber: services.ids.trackingNumber(),
          estimatedDelivery,
        });

        return {
          statusCode: 201,
          noStore: true,
          body: toPublicOrder(order, payload.shippingAddress),
        };
      } catch (error) {
        if (typeof services.books.releaseStock === 'function') {
          await services.books.releaseStock(payload.items);
        }

        throw error;
      }
    },

    async get({ auth, params }) {
      const order = await services.orders.getById(params.orderId);
      if (!order) {
        throw new HttpError(404, 'not_found', 'Order not found');
      }

      const isAdmin = getUserRole(auth.user) === 'admin';
      validateUserScopedAccess(auth.user, order.userId, isAdmin);

      return {
        statusCode: 200,
        noStore: true,
        body: toPublicOrder(order, decryptAddress(services, order.shippingAddressEncrypted)),
      };
    },

    async listUser({ auth, params }) {
      const isAdmin = getUserRole(auth.user) === 'admin';
      validateUserScopedAccess(auth.user, params.userId, isAdmin);
      const orders = await services.orders.listByUserId(params.userId);

      return {
        statusCode: 200,
        noStore: true,
        body: orders.map(order => toPublicOrder(order, decryptAddress(services, order.shippingAddressEncrypted))),
      };
    },
  };
}
