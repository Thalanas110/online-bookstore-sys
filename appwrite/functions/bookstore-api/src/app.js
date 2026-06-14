import { authenticateRequest } from './auth.js';
import { HttpError, toErrorResponse } from './errors.js';
import { createResponseHeaders, normalizeHeaders } from './http.js';
import { matchRoute } from './router.js';

function jsonResponse({ statusCode, body, headers }) {
  return {
    statusCode,
    body,
    headers,
  };
}

export function createApplication({ config, appwrite, routeHandlers }) {
  return async function handleRequest(request) {
    const headers = normalizeHeaders(request.headers);
    const origin = headers.origin ?? '';

    if (origin && !config.corsAllowedOrigins.includes(origin)) {
      return jsonResponse({
        statusCode: 403,
        body: {
          message: 'Origin not allowed',
          code: 403,
          type: 'forbidden',
        },
        headers: createResponseHeaders({
          origin: '',
          allowlist: config.corsAllowedOrigins,
          noStore: true,
        }),
      });
    }

    if (String(request.method ?? 'GET').toUpperCase() === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: createResponseHeaders({
          origin,
          allowlist: config.corsAllowedOrigins,
          noStore: true,
        }),
      };
    }

    try {
      const route = matchRoute(request.method, request.path, config.apiBasePath);
      if (!route) {
        throw new HttpError(404, 'not_found', 'Endpoint not found');
      }

      const handler = routeHandlers[route.handlerKey];
      if (!handler) {
        throw new HttpError(501, 'not_implemented', `Handler not implemented: ${route.handlerKey}`);
      }

      const auth = await authenticateRequest({
        route,
        request: {
          ...request,
          headers,
        },
        appwrite,
      });

      const result = await handler({
        route,
        params: route.params,
        request: {
          ...request,
          headers,
        },
        auth,
      });

      return jsonResponse({
        statusCode: result.statusCode ?? 200,
        body: result.body,
        headers: createResponseHeaders({
          origin,
          allowlist: config.corsAllowedOrigins,
          noStore: result.noStore ?? false,
          extraHeaders: result.headers,
        }),
      });
    } catch (error) {
      const failure = toErrorResponse(error);
      return jsonResponse({
        statusCode: failure.statusCode,
        body: {
          message: failure.message,
          code: failure.statusCode,
          type: failure.type,
        },
        headers: createResponseHeaders({
          origin,
          allowlist: config.corsAllowedOrigins,
          noStore: true,
        }),
      });
    }
  };
}
