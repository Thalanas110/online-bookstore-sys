import { HttpError } from './errors.js';

export function extractBearerToken(headers = {}) {
  const authorization = headers.authorization ?? headers.Authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function isAdminUser(user) {
  return (user?.role ?? user?.prefs?.role) === 'admin';
}

export async function authenticateRequest({ route, request, appwrite }) {
  const headers = request.headers ?? {};
  const jwt = extractBearerToken(headers);
  const userAgent = headers['user-agent'] ?? headers['User-Agent'] ?? '';

  if (route.auth === 'none') {
    if (!jwt) {
      return { jwt: null, user: null };
    }

    try {
      const user = await appwrite.getUserFromJwt({ jwt, userAgent });
      return { jwt, user };
    } catch {
      return { jwt: null, user: null };
    }
  }

  if (!jwt) {
    throw new HttpError(401, 'unauthorized', 'Authentication required');
  }

  let user;
  try {
    user = await appwrite.getUserFromJwt({ jwt, userAgent });
  } catch {
    throw new HttpError(401, 'unauthorized', 'Invalid or expired authentication token');
  }

  if (route.auth === 'admin' && !isAdminUser(user)) {
    throw new HttpError(403, 'forbidden', 'Admin access required');
  }

  return { jwt, user };
}
