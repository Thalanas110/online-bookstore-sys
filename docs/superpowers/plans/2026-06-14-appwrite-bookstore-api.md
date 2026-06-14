# Appwrite Bookstore API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock bookstore backend with real Appwrite Function HTTP endpoints backed by MongoDB, while keeping browser auth secure and enforcing AES-256-GCM for sensitive data.

**Architecture:** The frontend keeps Appwrite browser authentication for account/session management, then obtains short-lived Appwrite JWTs to call a Node 22 Appwrite Function over HTTPS. The Function exposes the documented `/api/...` routes, validates user/admin access with per-request JWT-backed Appwrite clients, persists books/orders/profiles in MongoDB, and encrypts sensitive fields server-side with AES-256-GCM.

**Tech Stack:** React, TypeScript, Vite, Appwrite Web SDK, Appwrite Functions, Node.js 22, MongoDB Node driver, Web Crypto API, Node `crypto`, Node test runner

---

## Chunk 1: Project Scaffolding And Security Contract

### Task 1: Add backend deployment scaffolding

**Files:**
- Create: `appwrite.config.json`
- Create: `appwrite/functions/bookstore-api/package.json`
- Create: `appwrite/functions/bookstore-api/.env.example`
- Create: `appwrite/functions/bookstore-api/src/main.js`
- Create: `appwrite/functions/bookstore-api/src/config.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

Create `tests/function/config.test.mjs` asserting the function config loader rejects missing required variables and malformed AES keys.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/config.test.mjs`
Expected: FAIL because the function config module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the Appwrite function scaffold, declare runtime dependencies (`mongodb` and `node-appwrite`), and add a config loader that requires:
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `AES_KEY_BASE64`

Require `AES_KEY_BASE64` to decode to exactly 32 bytes.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json appwrite.config.json appwrite/functions/bookstore-api tests/function/config.test.mjs
git commit -m "chore: scaffold Appwrite bookstore api"
```

### Task 2: Add crypto utilities with AES-256-GCM

**Files:**
- Create: `appwrite/functions/bookstore-api/src/crypto.js`
- Test: `tests/function/crypto.test.mjs`

- [ ] **Step 1: Write the failing test**

Create tests covering:
- encrypt/decrypt round-trip
- ciphertext differs across calls for same plaintext
- wrong key fails decryption
- output envelope contains IV and auth tag metadata

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/crypto.test.mjs`
Expected: FAIL because crypto helpers are not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement server-side AES-256-GCM using Node `crypto`:
- 32-byte key
- 12-byte IV
- base64url encoding for IV, auth tag, and ciphertext
- envelope shape `{ alg, iv, tag, data }`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/crypto.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add appwrite/functions/bookstore-api/src/crypto.js tests/function/crypto.test.mjs
git commit -m "test: add server encryption contract"
```

## Chunk 2: Appwrite Function Routing, Auth, And MongoDB Services

### Task 3: Implement request parsing and route coverage

**Files:**
- Create: `appwrite/functions/bookstore-api/src/http.js`
- Create: `appwrite/functions/bookstore-api/src/router.js`
- Test: `tests/function/router.test.mjs`

- [ ] **Step 1: Write the failing test**

Create tests asserting the router resolves these routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/change-password`
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`
- `POST /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/user/:userId`
- `GET /api/admin/users`
- `GET /api/admin/books`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/reports/sales`
- `GET /api/reports/orders`
- `GET /api/reports/inventory`

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/router.test.mjs`
Expected: FAIL because route resolution is missing.

- [ ] **Step 3: Write minimal implementation**

Implement:
- path normalization
- JSON body parsing
- query parsing
- route matching with path params
- HTTP helpers for JSON, empty, and error responses

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/router.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add appwrite/functions/bookstore-api/src/http.js appwrite/functions/bookstore-api/src/router.js tests/function/router.test.mjs
git commit -m "test: add api route coverage"
```

### Task 4: Implement Appwrite auth context and authorization guards

**Files:**
- Create: `appwrite/functions/bookstore-api/src/appwrite.js`
- Create: `appwrite/functions/bookstore-api/src/auth.js`
- Test: `tests/function/auth.test.mjs`

- [ ] **Step 1: Write the failing test**

Create tests covering:
- public auth routes do not require JWT
- protected routes reject requests without `Authorization: Bearer <jwt>`
- admin routes reject non-admin users
- valid JWT-backed user context resolves account data

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/auth.test.mjs`
Expected: FAIL because auth guards do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement per-request Appwrite clients:
- admin client using API key
- user-scoped client using JWT

Map browser `Authorization: Bearer <jwt>` to Appwrite `setJWT()`.
Use Appwrite account data plus `prefs.role === 'admin'` for admin checks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/auth.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add appwrite/functions/bookstore-api/src/appwrite.js appwrite/functions/bookstore-api/src/auth.js tests/function/auth.test.mjs
git commit -m "test: add function auth guards"
```

### Task 5: Implement MongoDB data access services

**Files:**
- Create: `appwrite/functions/bookstore-api/src/mongo.js`
- Create: `appwrite/functions/bookstore-api/src/repositories/books.js`
- Create: `appwrite/functions/bookstore-api/src/repositories/orders.js`
- Create: `appwrite/functions/bookstore-api/src/repositories/profiles.js`
- Test: `tests/function/repositories.test.mjs`

- [ ] **Step 1: Write the failing test**

Create tests for repository behavior using in-memory fakes:
- books filtering and sorting
- orders scoped to owning user unless admin
- profile upsert/update behavior
- low-stock/inventory reporting shape

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/repositories.test.mjs`
Expected: FAIL because repository modules do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement repository interfaces around Mongo collections:
- `books`
- `orders`
- `profiles`

Use stable field names and keep Appwrite user records as source-of-truth for email/name/role where appropriate.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/repositories.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add appwrite/functions/bookstore-api/src/mongo.js appwrite/functions/bookstore-api/src/repositories tests/function/repositories.test.mjs
git commit -m "feat: add mongodb repositories"
```

## Chunk 3: Endpoint Handlers And Frontend Integration

### Task 6: Implement auth, profile, books, orders, admin, and reports handlers

**Files:**
- Create: `appwrite/functions/bookstore-api/src/handlers/auth.js`
- Create: `appwrite/functions/bookstore-api/src/handlers/users.js`
- Create: `appwrite/functions/bookstore-api/src/handlers/books.js`
- Create: `appwrite/functions/bookstore-api/src/handlers/orders.js`
- Create: `appwrite/functions/bookstore-api/src/handlers/admin.js`
- Create: `appwrite/functions/bookstore-api/src/handlers/reports.js`
- Modify: `appwrite/functions/bookstore-api/src/main.js`
- Test: `tests/function/handlers.test.mjs`

- [ ] **Step 1: Write the failing test**

Create handler-level tests covering:
- auth endpoint response contracts
- profile address encryption at rest and plaintext on response
- order creation decrements stock and encrypts shipping address
- admin order status patch works
- report endpoints return documented fields

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/function/handlers.test.mjs`
Expected: FAIL because handlers are not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement handlers with secure defaults:
- input validation
- explicit allowlists for sortable/filterable fields
- uniform JSON error shape
- `Cache-Control: no-store` for auth/profile/order responses
- CORS origin allowlist via env var
- security headers: `X-Content-Type-Options`, `Content-Security-Policy: default-src 'none'`, `Referrer-Policy`, `X-Frame-Options`

Auth handlers should:
- create user via Appwrite server SDK
- create email/password session
- return session secret and expiry for non-browser clients
- support `GET /api/auth/me` via JWT-backed account lookup

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/function/handlers.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add appwrite/functions/bookstore-api/src/handlers appwrite/functions/bookstore-api/src/main.js tests/function/handlers.test.mjs
git commit -m "feat: implement bookstore api handlers"
```

### Task 7: Replace mock frontend API usage with Function-backed calls

**Files:**
- Modify: `src/lib/appwrite.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/components/SetupGuide.tsx`
- Test: `tests/frontend/api-client.test.mjs`

- [ ] **Step 1: Write the failing test**

Create tests for the browser API client covering:
- protected requests attach `Authorization: Bearer <jwt>`
- register/login/logout still use Appwrite account/session APIs
- API client normalizes error payloads

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/frontend/api-client.test.mjs`
Expected: FAIL because the API client still uses mocks.

- [ ] **Step 3: Write minimal implementation**

Update the frontend to:
- fetch JWT from `account.createJWT()` for protected API calls
- call the Function base URL from env
- remove demo/mock fallback behavior
- preserve secure browser-to-Appwrite session handling

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/frontend/api-client.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/appwrite.ts src/lib/api.ts src/contexts/AuthContext.tsx src/components/SetupGuide.tsx tests/frontend/api-client.test.mjs
git commit -m "feat: connect frontend to function api"
```

## Chunk 4: Documentation, Setup, And Verification

### Task 8: Align documentation with the real backend

**Files:**
- Modify: `API_DOCUMENTATION.md`
- Modify: `APPWRITE_SETUP.md`
- Modify: `README.md`
- Modify: `FEATURES.md`
- Modify: `src/app/components/ApiDocs.tsx`

- [ ] **Step 1: Write the failing test**

Add a docs contract test in `tests/docs/api-docs.test.mjs` asserting the key route list and required env vars appear in the markdown files.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/docs/api-docs.test.mjs`
Expected: FAIL because the docs still describe mock data and old auth/comms behavior.

- [ ] **Step 3: Write minimal implementation**

Update docs to describe:
- Appwrite Function domain usage
- JWT-based frontend-to-function auth
- MongoDB collections and indexes
- AES-256-GCM server-side encryption
- HTTPS-only communication and required env vars

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/docs/api-docs.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add API_DOCUMENTATION.md APPWRITE_SETUP.md README.md FEATURES.md src/app/components/ApiDocs.tsx tests/docs/api-docs.test.mjs
git commit -m "docs: align Appwrite MongoDB backend setup"
```

### Task 9: Final verification

**Files:**
- Verify: entire working tree

- [ ] **Step 1: Run backend tests**

Run: `node --test tests/function/*.test.mjs tests/frontend/*.test.mjs tests/docs/*.test.mjs`
Expected: all PASS

- [ ] **Step 2: Run frontend build**

Run: `npm run build`
Expected: exit code 0

- [ ] **Step 3: Review route coverage against docs**

Check `API_DOCUMENTATION.md` against the router table and confirm every documented endpoint exists in the Function.

- [ ] **Step 4: Summarize any remaining deployment-only gaps**

Document anything that requires user-provided secrets or a live Appwrite/MongoDB project:
- Appwrite project ID
- Appwrite API key
- Function ID/domain
- MongoDB connection string
- AES key

