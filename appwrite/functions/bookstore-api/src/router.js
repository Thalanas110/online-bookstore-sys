export const ROUTES = [
  { method: 'POST', pattern: '/auth/register', auth: 'none', handlerKey: 'auth.register' },
  { method: 'POST', pattern: '/auth/login', auth: 'none', handlerKey: 'auth.login' },
  { method: 'POST', pattern: '/auth/logout', auth: 'user', handlerKey: 'auth.logout' },
  { method: 'GET', pattern: '/auth/me', auth: 'user', handlerKey: 'auth.me' },
  { method: 'GET', pattern: '/users/profile', auth: 'user', handlerKey: 'users.getProfile' },
  { method: 'PUT', pattern: '/users/profile', auth: 'user', handlerKey: 'users.updateProfile' },
  { method: 'PUT', pattern: '/users/change-password', auth: 'user', handlerKey: 'users.changePassword' },
  { method: 'GET', pattern: '/books', auth: 'user', handlerKey: 'books.list' },
  { method: 'GET', pattern: '/books/:bookId', auth: 'user', handlerKey: 'books.get' },
  { method: 'POST', pattern: '/books', auth: 'admin', handlerKey: 'books.create' },
  { method: 'PUT', pattern: '/books/:bookId', auth: 'admin', handlerKey: 'books.update' },
  { method: 'DELETE', pattern: '/books/:bookId', auth: 'admin', handlerKey: 'books.delete' },
  { method: 'POST', pattern: '/orders', auth: 'user', handlerKey: 'orders.create' },
  { method: 'GET', pattern: '/orders/:orderId', auth: 'user', handlerKey: 'orders.get' },
  { method: 'GET', pattern: '/orders/user/:userId', auth: 'user', handlerKey: 'orders.listUser' },
  { method: 'GET', pattern: '/admin/users', auth: 'admin', handlerKey: 'admin.listUsers' },
  { method: 'GET', pattern: '/admin/books', auth: 'admin', handlerKey: 'admin.listBooks' },
  { method: 'GET', pattern: '/admin/orders', auth: 'admin', handlerKey: 'admin.listOrders' },
  { method: 'PATCH', pattern: '/admin/orders/:orderId/status', auth: 'admin', handlerKey: 'admin.updateOrderStatus' },
  { method: 'GET', pattern: '/reports/sales', auth: 'admin', handlerKey: 'reports.sales' },
  { method: 'GET', pattern: '/reports/orders', auth: 'admin', handlerKey: 'reports.orders' },
  { method: 'GET', pattern: '/reports/inventory', auth: 'admin', handlerKey: 'reports.inventory' },
];

function splitPath(path) {
  const normalized = String(path ?? '/')
    .replace(/\/+$/g, '')
    .replace(/^$/, '/');

  return normalized === '/'
    ? []
    : normalized.replace(/^\/+/g, '').split('/');
}

export function matchRoute(method, path, apiBasePath = '/api') {
  const upperMethod = String(method ?? 'GET').toUpperCase();
  const cleanedBase = apiBasePath.replace(/\/+$/g, '');
  const cleanedPath = String(path ?? '/').replace(/\/+$/g, '') || '/';

  if (!cleanedPath.startsWith(cleanedBase)) {
    return null;
  }

  const relativePath = cleanedPath.slice(cleanedBase.length) || '/';
  const requestParts = splitPath(relativePath);

  for (const route of ROUTES) {
    if (route.method !== upperMethod) {
      continue;
    }

    const routeParts = splitPath(route.pattern);
    if (routeParts.length !== requestParts.length) {
      continue;
    }

    const params = {};
    let matched = true;

    for (let index = 0; index < routeParts.length; index += 1) {
      const routePart = routeParts[index];
      const requestPart = requestParts[index];

      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = requestPart;
        continue;
      }

      if (routePart !== requestPart) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return {
        ...route,
        params,
        fullPattern: `${cleanedBase}${route.pattern}`,
      };
    }
  }

  return null;
}
