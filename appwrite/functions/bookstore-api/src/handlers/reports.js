import { toPublicOrder } from '../mappers.js';

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function monthLabel(isoDate) {
  return new Date(isoDate).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

export function createReportHandlers(services) {
  return {
    async sales() {
      const orders = (await services.orders.listAll()).filter(order => order.status !== 'cancelled');
      const totalSales = roundCurrency(orders.reduce((sum, order) => sum + order.totalAmount, 0));
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders === 0 ? 0 : roundCurrency(totalSales / totalOrders);

      const bookTotals = new Map();
      const monthlyTotals = new Map();

      for (const order of orders) {
        const month = monthLabel(order.createdAt);
        const currentMonth = monthlyTotals.get(month) ?? { month, sales: 0, orders: 0 };
        currentMonth.sales = roundCurrency(currentMonth.sales + order.totalAmount);
        currentMonth.orders += 1;
        monthlyTotals.set(month, currentMonth);

        for (const item of order.items) {
          const entry = bookTotals.get(item.bookId) ?? {
            bookId: item.bookId,
            title: item.bookTitle,
            totalSold: 0,
            revenue: 0,
          };
          entry.totalSold += item.quantity;
          entry.revenue = roundCurrency(entry.revenue + (item.quantity * item.price));
          bookTotals.set(item.bookId, entry);
        }
      }

      return {
        statusCode: 200,
        body: {
          totalSales,
          totalOrders,
          averageOrderValue,
          topSellingBooks: [...bookTotals.values()].sort((left, right) => right.totalSold - left.totalSold),
          salesByMonth: [...monthlyTotals.values()],
        },
      };
    },

    async orders() {
      const orders = await services.orders.listAll();
      const ordersByStatus = {
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
      };

      for (const order of orders) {
        ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
      }

      return {
        statusCode: 200,
        body: {
          totalOrders: orders.length,
          ordersByStatus,
          averageProcessingTime: null,
          recentOrders: orders.slice(0, 10).map(order => toPublicOrder(order)),
        },
      };
    },

    async inventory({ request }) {
      const lowStockThreshold = Number(request.query?.lowStockThreshold ?? 10);
      const books = await services.books.list();

      return {
        statusCode: 200,
        body: {
          totalBooks: books.length,
          lowStock: books.filter(book => book.stock > 0 && book.stock <= lowStockThreshold),
          outOfStock: books.filter(book => book.stock === 0),
        },
      };
    },
  };
}
