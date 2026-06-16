# API Documentation

HTTP API for the Appwrite Function-backed bookstore service.

## Base URL

All routes are served from the Appwrite Function domain:

```text
https://<bookstore-api-function-domain>/api
```

Examples:

```text
Development: https://<your-function-domain>/api
Production:  https://<your-function-domain-or-custom-domain>/api
```

The frontend reads this value from `VITE_API_BASE_URL`.

## Authentication Model

There are two authentication paths:

1. Browser clients authenticate directly with Appwrite using the Appwrite Web SDK.
2. Before calling the Function, the browser creates a short-lived Appwrite JWT with `account.createJWT({ duration: 900 })` and sends it as:

```http
Authorization: Bearer <appwrite-user-jwt>
```

Non-browser clients can use the server auth endpoints below.

## Security

- HTTPS is required for the Function domain and Appwrite endpoint, except for localhost development.
- CORS is restricted by `CORS_ALLOWED_ORIGINS`.
- Responses include HSTS, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.
- Sensitive profile and order address fields are encrypted server-side with AES-256-GCM before storage in Appwrite TablesDB.
- Appwrite API keys are never exposed to the frontend.

## Error Format

All non-`204` error responses use:

```json
{
  "message": "Error description",
  "code": 400,
  "type": "bad_request"
}
```

Common codes:

- `400` invalid input
- `401` missing or invalid Appwrite JWT
- `403` insufficient role or origin not allowed
- `404` resource not found
- `409` conflict, duplicate ISBN, or insufficient stock
- `500` internal error

## Endpoints

### Auth

#### `POST /api/auth/register`

Creates an Appwrite user account.

Request:

```json
{
  "email": "reader@example.com",
  "password": "password123",
  "name": "Reader One"
}
```

Response `201`:

```json
{
  "$id": "user_abc123",
  "name": "Reader One",
  "email": "reader@example.com",
  "role": "user"
}
```

#### `POST /api/auth/login`

Creates an Appwrite email/password session for non-browser clients.

Request:

```json
{
  "email": "reader@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "user": {
    "$id": "user_abc123",
    "name": "Reader One",
    "email": "reader@example.com",
    "role": "user"
  },
  "session": {
    "secret": "session_secret_value",
    "expire": "2026-06-15T00:00:00.000Z"
  }
}
```

#### `POST /api/auth/logout`

Deletes the current Appwrite session represented by the bearer JWT.

Authentication: `user`

Response `204`

#### `GET /api/auth/me`

Returns the authenticated user plus Appwrite-backed profile fields.

Authentication: `user`

Response `200`:

```json
{
  "$id": "user_abc123",
  "name": "Reader One",
  "email": "reader@example.com",
  "role": "user",
  "phone": "+15555550123",
  "address": "123 Main St, Singapore 123456"
}
```

### Users

#### `GET /api/users/profile`

Same user profile payload as `/api/auth/me`.

Authentication: `user`

#### `PUT /api/users/profile`

Updates Appwrite name plus Appwrite-backed phone and encrypted address.

Authentication: `user`

Request:

```json
{
  "name": "Reader Updated",
  "phone": "+15555550123",
  "address": "123 Main St, Singapore 123456"
}
```

Response `200`:

```json
{
  "$id": "user_abc123",
  "name": "Reader Updated",
  "email": "reader@example.com",
  "role": "user",
  "phone": "+15555550123",
  "address": "123 Main St, Singapore 123456"
}
```

#### `PUT /api/users/change-password`

Changes the authenticated user's Appwrite password.

Authentication: `user`

Request:

```json
{
  "oldPassword": "password123",
  "newPassword": "new-password-456"
}
```

Response `204`

### Books

#### `GET /api/books`

Lists books from Appwrite TablesDB.

Authentication: `user`

Query parameters:

- `search` optional text filter across title, author, ISBN, and category
- `category` optional exact category match

Response `200`:

```json
[
  {
    "$id": "book_abc123",
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
]
```

#### `GET /api/books/{bookId}`

Returns a single book.

Authentication: `user`

#### `POST /api/books`

Creates a book.

Authentication: `admin`

Request:

```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "isbn": "9780441013593",
  "price": 19.99,
  "stock": 12,
  "description": "Science fiction classic",
  "category": "Science Fiction",
  "publishedYear": 1965,
  "imageUrl": "https://example.com/dune.jpg",
  "rating": 4.8,
  "reviewCount": 8903,
  "isFeatured": true,
  "isBestseller": true,
  "isNew": false,
  "discount": 5
}
```

Response `201`: the created book object.

#### `PUT /api/books/{bookId}`

Updates any subset of book fields.

Authentication: `admin`

#### `DELETE /api/books/{bookId}`

Deletes a book.

Authentication: `admin`

Response `204`

### Orders

#### `POST /api/orders`

Creates an order. Client-supplied prices are ignored; totals are recomputed from stored book data. Shipping address is encrypted with AES-256-GCM before storage.

Authentication: `user`

Request:

```json
{
  "items": [
    {
      "bookId": "book_abc123",
      "quantity": 2
    }
  ],
  "shippingAddress": "456 Oak Ave, Singapore 654321"
}
```

Response `201`:

```json
{
  "$id": "order_abc123",
  "userId": "user_abc123",
  "items": [
    {
      "bookId": "book_abc123",
      "bookTitle": "The Great Gatsby",
      "bookAuthor": "F. Scott Fitzgerald",
      "imageUrl": "https://example.com/gatsby.jpg",
      "quantity": 2,
      "price": 14.39
    }
  ],
  "totalAmount": 28.78,
  "status": "pending",
  "shippingAddress": "456 Oak Ave, Singapore 654321",
  "trackingNumber": "TRKABC123456",
  "estimatedDelivery": "2026-06-22T10:00:00.000Z",
  "createdAt": "2026-06-16T10:00:00.000Z",
  "updatedAt": "2026-06-16T10:00:00.000Z"
}
```

#### `GET /api/orders/{orderId}`

Returns a single order. Non-admin users may only access their own order.

Authentication: `user`

#### `GET /api/orders/user/{userId}`

Lists orders for a user. Non-admin users may only request their own user ID.

Authentication: `user`

### Admin

#### `GET /api/admin/users`

Lists Appwrite users merged with Appwrite-backed profile data.

Authentication: `admin`

#### `GET /api/admin/books`

Lists books plus computed `totalSold` and `revenue`.

Authentication: `admin`

#### `GET /api/admin/orders`

Lists all orders with decrypted shipping address.

Authentication: `admin`

#### `PATCH /api/admin/orders/{orderId}/status`

Updates order status.

Authentication: `admin`

Request:

```json
{
  "status": "processing"
}
```

Allowed status values:

- `pending`
- `processing`
- `shipped`
- `completed`
- `cancelled`

### Reports

#### `GET /api/reports/sales`

Returns:

```json
{
  "totalSales": 28458.5,
  "totalOrders": 356,
  "averageOrderValue": 79.94,
  "topSellingBooks": [
    {
      "bookId": "book_abc123",
      "title": "The Great Gatsby",
      "totalSold": 89,
      "revenue": 1280.71
    }
  ],
  "salesByMonth": [
    {
      "month": "Jun",
      "sales": 4312.55,
      "orders": 54
    }
  ]
}
```

Authentication: `admin`

#### `GET /api/reports/orders`

Returns:

```json
{
  "totalOrders": 356,
  "ordersByStatus": {
    "pending": 12,
    "processing": 8,
    "shipped": 21,
    "completed": 309,
    "cancelled": 6
  },
  "averageProcessingTime": null,
  "recentOrders": [
    {
      "$id": "order_abc123",
      "userId": "user_abc123",
      "items": [],
      "totalAmount": 28.78,
      "status": "pending",
      "trackingNumber": "TRKABC123456",
      "estimatedDelivery": "2026-06-22T10:00:00.000Z",
      "createdAt": "2026-06-16T10:00:00.000Z",
      "updatedAt": "2026-06-16T10:00:00.000Z"
    }
  ]
}
```

Authentication: `admin`

#### `GET /api/reports/inventory`

Query parameters:

- `lowStockThreshold` optional integer, default `10`

Returns:

```json
{
  "totalBooks": 64,
  "lowStock": [],
  "outOfStock": []
}
```

Authentication: `admin`

## cURL Examples

### Protected request with Appwrite JWT

```bash
curl -X GET "https://<bookstore-api-function-domain>/api/books" \
  -H "Authorization: Bearer <APPWRITE_USER_JWT>" \
  -H "Accept: application/json"
```

### Create order

```bash
curl -X POST "https://<bookstore-api-function-domain>/api/orders" \
  -H "Authorization: Bearer <APPWRITE_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "bookId": "book_abc123", "quantity": 2 }
    ],
    "shippingAddress": "456 Oak Ave, Singapore 654321"
  }'
```

### Non-browser login

```bash
curl -X POST "https://<bookstore-api-function-domain>/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reader@example.com",
    "password": "password123"
  }'
```

## Data Storage

Appwrite database used by the Function:

- `online-bookstore`

Appwrite tables used by the Function:

- `books`
- `orders`
- `profiles`

Encrypted fields at rest:

- `profiles.addressEncrypted`
- `orders.shippingAddressEncrypted`

Notes:

- `orders.items` is stored as serialized JSON text in TablesDB and parsed back by the Function.

## Version

- API version: `v1`
- Last updated: June 16, 2026
