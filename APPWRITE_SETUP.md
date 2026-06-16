# Appwrite Setup Guide

Setup for the current production architecture in this repository:

- Appwrite Authentication for browser and server identity
- Appwrite Function `bookstore-api` for all `/api/...` server endpoints
- Appwrite Databases / TablesDB for `books`, `orders`, and `profiles`
- AES-256-GCM encryption in the Function for sensitive fields

## Architecture

1. The browser signs in directly with Appwrite using the Web SDK.
2. The browser creates a short-lived Appwrite JWT for each backend request.
3. The browser calls the Appwrite Function domain over HTTPS.
4. The Function validates the JWT with Appwrite, applies user/admin authorization, and reads or writes Appwrite TablesDB.
5. Shipping and profile addresses are encrypted server-side with AES-256-GCM before being stored.

## Prerequisites

- An Appwrite Cloud or self-hosted Appwrite project
- Node.js 22+ for local work
- Appwrite CLI installed and logged in

CLI references:

- `appwrite push tables`
- `appwrite push functions`

## 1. Create The Appwrite Project

1. Create a new Appwrite project.
2. Add a Web platform for every frontend origin you will use.
3. Enable Email/Password authentication.

For local development, include:

```text
http://localhost:5173
```

For production, include your real frontend origin, for example:

```text
https://bookstore.example.com
```

## 2. Create The Function API Key

Create an Appwrite API key for the Function with these scopes:

- `users.read`
- `users.write`

This key is only used inside the Function. Do not expose it to the frontend.

## 3. Push The Database Schema

This repository now includes the Appwrite database and table definitions in [appwrite.config.json](/E:/all-projects/active/personal/online-bookstore-system/appwrite.config.json):

- Database ID: `online-bookstore`
- Table ID: `books`
- Table ID: `orders`
- Table ID: `profiles`

Push them from the repository root:

```bash
appwrite push tables
```

The checked-in schema creates these indexes:

- `books.isbn` unique
- `books.category + updatedAt`
- `orders.userId + createdAt`
- `orders.status + createdAt`
- `profiles.userId` unique

### Notes About Stored Shapes

- `orders.items` is stored as serialized JSON text in TablesDB and parsed back by the Function.
- `profiles.addressEncrypted` and `orders.shippingAddressEncrypted` remain encrypted strings at rest.

### Minimal Book Seed Row

After the schema exists, create at least one `books` row in Appwrite Console or via API:

```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 15.99,
  "stock": 50,
  "description": "Classic novel",
  "category": "Fiction",
  "publishedYear": 1925,
  "imageUrl": "https://example.com/gatsby.jpg",
  "rating": 4.2,
  "reviewCount": 4821,
  "isFeatured": true,
  "isBestseller": true,
  "isNew": false,
  "discount": 10,
  "createdAt": "2026-06-16T10:00:00.000Z",
  "updatedAt": "2026-06-16T10:00:00.000Z"
}
```

Use the row ID you want exposed by the API, for example `book_gatsby`.

## 4. Generate The AES-256-GCM Key

Generate a 32-byte base64 key:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Store the output as `AES_KEY_BASE64`.

## 5. Configure Function Environment Variables

The checked-in Function lives at:

```text
appwrite/functions/bookstore-api
```

Use [appwrite/functions/bookstore-api/.env.example](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/.env.example) as the template.

Required Function variables:

```env
APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<APPWRITE_PROJECT_ID>
APPWRITE_API_KEY=<FUNCTION_API_KEY>
APPWRITE_DATABASE_ID=online-bookstore
APPWRITE_BOOKS_TABLE_ID=books
APPWRITE_ORDERS_TABLE_ID=orders
APPWRITE_PROFILES_TABLE_ID=profiles
AES_KEY_BASE64=<32_BYTE_BASE64_KEY>
API_BASE_PATH=/api
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://bookstore.example.com
```

Notes:

- `APPWRITE_PROJECT_ID` can also be satisfied by `APPWRITE_FUNCTION_PROJECT_ID` at runtime, but keep it explicit in your Function variables.
- `CORS_ALLOWED_ORIGINS` should be an exact comma-separated allowlist.
- `API_BASE_PATH` should stay `/api` unless you intentionally change the router.

## 6. Deploy The Function

Important checked-in Function settings:

- Function ID: `bookstore-api`
- Runtime: `node-22`
- Entrypoint: `src/main.js`
- Build command: `npm install`
- Execute access: `any`

Why `execute: any` is intentional:

- The Function domain must be callable over HTTPS.
- Real authorization is enforced inside the Function with Appwrite JWT validation and admin/user route checks.
- CORS is still restricted to your allowlist.

Deploy from the repository root:

```bash
appwrite push functions --with-variables
```

If you already saved variables in the Console and do not want local `.env` to overwrite them, use:

```bash
appwrite push functions
```

## 7. Get The Function Domain

After deployment:

1. Open **Functions** in Appwrite Console.
2. Open `bookstore-api`.
3. Copy the generated HTTPS domain or attach a custom domain.
4. Append `/api` when setting the frontend API base URL.

Example:

```text
https://bookstore-api-abc123.appwrite.global/api
```

## 8. Configure Frontend Environment Variables

Create a root `.env` file for Vite from [.env.example](/E:/all-projects/active/personal/online-bookstore-system/.env.example):

```env
VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<APPWRITE_PROJECT_ID>
VITE_API_BASE_URL=https://<bookstore-api-function-domain>/api
```

Requirements:

- `VITE_APPWRITE_ENDPOINT` must be HTTPS unless you are on localhost.
- `VITE_API_BASE_URL` must be HTTPS unless you are on localhost.
- Do not put `APPWRITE_API_KEY` in the frontend `.env`.

## 9. Make An Admin User

Admin access is determined from the Appwrite user role preference:

```json
{
  "role": "admin"
}
```

To set it:

1. Open **Auth > Users**.
2. Select the user.
3. Edit **Preferences**.
4. Save `{"role":"admin"}`.

## 10. Start The Frontend

Install dependencies and run Vite:

```bash
npm install
npm run dev
```

The browser auth flow is:

1. `api.register()` or `api.login()` creates an Appwrite session with the Web SDK.
2. Protected data requests call `account.createJWT({ duration: 900 })`.
3. The JWT is sent to the Function as a bearer token.

## Security Checklist

- Use HTTPS for both `VITE_APPWRITE_ENDPOINT` and `VITE_API_BASE_URL`.
- Keep `APPWRITE_API_KEY` only in Function variables.
- Keep `CORS_ALLOWED_ORIGINS` exact and minimal.
- Rotate `AES_KEY_BASE64` and API keys through your secret manager, not source control.
- Prefer a custom Function domain in production so the API URL is stable.
- Treat direct table access as disabled for clients; this app is designed to use the Function boundary.

## Verification

### Backend tests

Run from the repository root:

```bash
node --test tests/function/config.test.mjs tests/function/crypto.test.mjs tests/function/router.test.mjs tests/function/auth.test.mjs tests/function/handlers.test.mjs tests/function/books.test.mjs tests/function/app.test.mjs tests/function/repositories.test.mjs tests/function/tablesdb.test.mjs
```

### Frontend build

```bash
npm run build
```

### Smoke test

1. Register a user in the browser.
2. Promote a user to admin if you need admin routes.
3. Create or import a few Appwrite `books` rows.
4. Browse `/books`.
5. Place an order.
6. Confirm the `orders` row stores `shippingAddressEncrypted`, not plaintext.
7. Confirm the `profiles` row stores `addressEncrypted`, not plaintext.

## Troubleshooting

### 401 from the Function

Likely causes:

- No Appwrite session exists in the browser
- The frontend is not sending the JWT
- The JWT expired

### 403 Origin not allowed

Update `CORS_ALLOWED_ORIGINS` in the Function variables and redeploy.

### Empty book catalog

The Appwrite schema exists, but the `books` table has no rows yet. Create or import sample `books` rows.

### Appwrite login works but API calls fail

Check:

- `VITE_API_BASE_URL` points to the Function domain with `/api`
- Function execute access is `any`
- Function variables are set correctly
- Appwrite Web platform includes the frontend origin
- The expected database and tables were pushed successfully

## File Map

- Backend entrypoint: [appwrite/functions/bookstore-api/src/main.js](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/src/main.js)
- TablesDB bootstrap: [appwrite/functions/bookstore-api/src/tablesdb.js](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/src/tablesdb.js)
- Backend config: [appwrite.config.json](/E:/all-projects/active/personal/online-bookstore-system/appwrite.config.json)
- Function env template: [appwrite/functions/bookstore-api/.env.example](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/.env.example)
- Frontend API client: [src/lib/api.ts](/E:/all-projects/active/personal/online-bookstore-system/src/lib/api.ts)
- Frontend Appwrite client: [src/lib/appwrite.ts](/E:/all-projects/active/personal/online-bookstore-system/src/lib/appwrite.ts)

Last updated: June 16, 2026
