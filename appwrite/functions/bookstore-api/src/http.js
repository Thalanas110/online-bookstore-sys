const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export function normalizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

export function isOriginAllowed(origin, allowlist = []) {
  if (!origin) {
    return true;
  }

  return allowlist.includes(origin);
}

export function createResponseHeaders({ origin, allowlist = [], noStore = false, extraHeaders = {} } = {}) {
  const headers = {
    ...BASE_HEADERS,
    ...extraHeaders,
  };

  if (noStore) {
    headers['Cache-Control'] = 'no-store';
  }

  if (origin && isOriginAllowed(origin, allowlist)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers.Vary = 'Origin';
  }

  return headers;
}
