# Appwrite Setup Guide

Setup for the production architecture in this repository:

- Appwrite Authentication for user identity and browser sessions
- Appwrite Function `bookstore-api` for all `/api/...` server endpoints
- MongoDB for books, orders, and profile storage
- AES-256-GCM encryption in the Function for sensitive fields

## Architecture

1. The browser signs in directly with Appwrite using the Web SDK.
2. The browser creates a short-lived Appwrite JWT for each backend request.
3. The browser calls the Appwrite Function domain over HTTPS.
4. The Function validates the JWT with Appwrite, applies user/admin authorization, and reads or writes MongoDB.
5. Shipping and profile addresses are encrypted server-side with AES-256-GCM before being stored.

## Prerequisites

- An Appwrite Cloud or self-hosted Appwrite project
- A MongoDB deployment
- Node.js 22+ for local work
- Appwrite CLI installed and logged in

CLI reference: `appwrite push functions` is the primary deploy command according to the current Appwrite CLI docs.

## 1. Create the Appwrite Project

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

## 2. Create the Function API Key

Create an Appwrite API key for the Function with these scopes:

- `users.read`
- `users.write`

This key is only used inside the Function. Do not expose it to the frontend.

## 3. Prepare MongoDB

Create a database, for example:

```text
online_bookstore
```

The Function uses these collections:

- `books`
- `orders`
- `profiles`

Indexes are created automatically by the Function on first successful start:

- `books.isbn` unique
- `books.category + updatedAt`
- `orders.userId + createdAt`
- `orders.status + createdAt`
- `profiles.userId` unique

### Minimal Book Document Shape

Import or insert book documents like this:

```json
{
  "_id": "book_gatsby",
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
  "createdAt": "2026-06-14T10:00:00.000Z",
  "updatedAt": "2026-06-14T10:00:00.000Z"
}
```

## 4. Generate the AES-256-GCM Key

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
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
MONGODB_DB_NAME=online_bookstore
AES_KEY_BASE64=<32_BYTE_BASE64_KEY>
API_BASE_PATH=/api
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://bookstore.example.com
```

Notes:

- `APPWRITE_PROJECT_ID` can also be satisfied by `APPWRITE_FUNCTION_PROJECT_ID` at runtime, but keep it explicit in your Function variables.
- `CORS_ALLOWED_ORIGINS` should be an exact comma-separated allowlist.
- `API_BASE_PATH` should stay `/api` unless you intentionally change the router.

## 6. Deploy the Function

The repository already includes [appwrite.config.json](/E:/all-projects/active/personal/online-bookstore-system/appwrite.config.json) with the Function definition.

Important checked-in settings:

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
appwrite login
appwrite push functions
```

If you change Function variables or configuration in the Appwrite Console, redeploy so the active deployment matches the code.

## 7. Get the Function Domain

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

## 9. Make an Admin User

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

## 10. Start the Frontend

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
- Use MongoDB credentials with least privilege.
- Prefer a custom Function domain in production so the API URL is stable.

## Verification

### Backend tests

Run from the repository root:

```bash
node --test tests/function/config.test.mjs tests/function/crypto.test.mjs tests/function/router.test.mjs tests/function/auth.test.mjs tests/function/handlers.test.mjs tests/function/books.test.mjs tests/function/app.test.mjs
```

### Frontend build

```bash
npm run build
```

### Smoke test

1. Register a user in the browser.
2. Promote a user to admin if you need admin routes.
3. Create or import a few MongoDB `books` documents.
4. Browse `/books`.
5. Place an order.
6. Confirm the `orders` document stores `shippingAddressEncrypted`, not plaintext.
7. Confirm the `profiles` document stores `addressEncrypted`, not plaintext.

## Troubleshooting

### 401 from the Function

Likely causes:

- No Appwrite session exists in the browser
- The frontend is not sending the JWT
- The JWT expired

### 403 Origin not allowed

Update `CORS_ALLOWED_ORIGINS` in the Function variables and redeploy.

### Empty book catalog

MongoDB is connected, but `books` has no documents yet. Import sample documents into the `books` collection.

### Appwrite login works but API calls fail

Check:

- `VITE_API_BASE_URL` points to the Function domain with `/api`
- Function execute access is `any`
- Function variables are set correctly
- Appwrite Web platform includes the frontend origin

## File Map

- Backend entrypoint: [appwrite/functions/bookstore-api/src/main.js](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/src/main.js)
- Backend config: [appwrite.config.json](/E:/all-projects/active/personal/online-bookstore-system/appwrite.config.json)
- Function env template: [appwrite/functions/bookstore-api/.env.example](/E:/all-projects/active/personal/online-bookstore-system/appwrite/functions/bookstore-api/.env.example)
- Frontend API client: [src/lib/api.ts](/E:/all-projects/active/personal/online-bookstore-system/src/lib/api.ts)
- Frontend Appwrite client: [src/lib/appwrite.ts](/E:/all-projects/active/personal/online-bookstore-system/src/lib/appwrite.ts)

Last updated: June 14, 2026
