# API Documentation

Complete API documentation for the Online Bookstore Management System.

## Base URL

All API endpoints are relative to your Appwrite project endpoint.

```
Development: http://localhost/v1
Production: https://cloud.appwrite.io/v1
```

## Authentication

All API requests (except registration and login) require authentication via Appwrite session cookies.

### Headers

```
Content-Type: application/json
```

Session cookies are automatically managed by the Appwrite SDK.

## Endpoints

### Authentication Endpoints

#### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "$id": "user_id_123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "user"
}
```

**Errors:**
- `400` - Invalid email or password
- `409` - User already exists

---

#### Login User

Authenticate and create a session.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "$id": "user_id_123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "user",
  "phone": "555-0123",
  "address": "123 Main St"
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

#### Logout User

Terminate the current session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Response:** `204 No Content`

**Errors:**
- `401` - Not authenticated

---

### Profile & User Management

#### Get Current User Profile

Retrieve the authenticated user's profile.

**Endpoint:** `GET /api/users/profile`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "$id": "user_id_123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "user",
  "phone": "555-0123",
  "address": "123 Main St, City, State 12345"
}
```

**Errors:**
- `401` - Not authenticated

---

#### Update User Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/users/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "555-9876",
  "address": "456 Oak Ave, City, State 67890"
}
```

**Response:** `200 OK`
```json
{
  "$id": "user_id_123",
  "name": "Jane Doe",
  "email": "user@example.com",
  "role": "user",
  "phone": "555-9876",
  "address": "456 Oak Ave, City, State 67890"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid data

---

#### Change Password

Change the authenticated user's password.

**Endpoint:** `PUT /api/users/change-password`

**Authentication:** Required

**Request Body:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:** `204 No Content`

**Errors:**
- `401` - Not authenticated or wrong old password
- `400` - Invalid new password (must be 8+ characters)

---

### Books Endpoints

#### Create Book

Create a new book (admin only).

**Endpoint:** `POST /api/books`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 15.99,
  "stock": 50,
  "description": "A classic American novel",
  "category": "Fiction",
  "publishedYear": 1925,
  "imageUrl": "https://example.com/cover.jpg"
}
```

**Response:** `201 Created`
```json
{
  "$id": "book_id_123",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 15.99,
  "stock": 50,
  "description": "A classic American novel",
  "category": "Fiction",
  "publishedYear": 1925,
  "imageUrl": "https://example.com/cover.jpg"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)
- `400` - Invalid data

---

#### Get All Books

Retrieve all books with optional filtering.

**Endpoint:** `GET /api/books`

**Authentication:** Required

**Query Parameters:**
- `search` (optional) - Search by title or author
- `category` (optional) - Filter by category

**Example:**
```
GET /api/books?search=gatsby&category=Fiction
```

**Response:** `200 OK`
```json
[
  {
    "$id": "book_id_123",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "price": 15.99,
    "stock": 50,
    "description": "A classic American novel",
    "category": "Fiction",
    "publishedYear": 1925,
    "imageUrl": "https://example.com/cover.jpg"
  }
]
```

**Errors:**
- `401` - Not authenticated

---

#### Get Book by ID

Retrieve a specific book.

**Endpoint:** `GET /api/books/{book_id}`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "$id": "book_id_123",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 15.99,
  "stock": 50,
  "description": "A classic American novel",
  "category": "Fiction",
  "publishedYear": 1925,
  "imageUrl": "https://example.com/cover.jpg"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Book not found

---

#### Update Book

Update a book's information (admin only).

**Endpoint:** `PUT /api/books/{book_id}`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "price": 17.99,
  "stock": 45
}
```

**Response:** `200 OK`
```json
{
  "$id": "book_id_123",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 17.99,
  "stock": 45,
  "description": "A classic American novel",
  "category": "Fiction",
  "publishedYear": 1925
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)
- `404` - Book not found
- `400` - Invalid data

---

#### Delete Book

Delete a book from inventory (admin only).

**Endpoint:** `DELETE /api/books/{book_id}`

**Authentication:** Required (Admin)

**Response:** `204 No Content`

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)
- `404` - Book not found

---

### Orders Endpoints

#### Create Order

Create a new order.

**Endpoint:** `POST /api/orders`

**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "bookId": "book_id_123",
      "bookTitle": "The Great Gatsby",
      "quantity": 2,
      "price": 15.99
    }
  ],
  "shippingAddress": "123 Main St, City, State 12345"
}
```

**Note:** The shipping address will be encrypted using AES-256-GCM before storage.

**Response:** `201 Created`
```json
{
  "$id": "order_id_456",
  "userId": "user_id_123",
  "items": [
    {
      "bookId": "book_id_123",
      "bookTitle": "The Great Gatsby",
      "quantity": 2,
      "price": 15.99
    }
  ],
  "totalAmount": 31.98,
  "status": "pending",
  "shippingAddress": "123 Main St, City, State 12345",
  "createdAt": "2026-06-01T12:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid order data
- `409` - Insufficient stock

---

#### Get Order by ID

Retrieve a specific order.

**Endpoint:** `GET /api/orders/{order_id}`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "$id": "order_id_456",
  "userId": "user_id_123",
  "items": [
    {
      "bookId": "book_id_123",
      "bookTitle": "The Great Gatsby",
      "quantity": 2,
      "price": 15.99
    }
  ],
  "totalAmount": 31.98,
  "status": "processing",
  "shippingAddress": "123 Main St, City, State 12345",
  "createdAt": "2026-06-01T12:00:00.000Z"
}
```

**Note:** Shipping address is decrypted automatically for the order owner.

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not order owner or admin)
- `404` - Order not found

---

#### Get User Orders

Retrieve all orders for a specific user.

**Endpoint:** `GET /api/orders/user/{user_id}`

**Authentication:** Required

**Authorization:** User can only access their own orders, admins can access any.

**Response:** `200 OK`
```json
[
  {
    "$id": "order_id_456",
    "userId": "user_id_123",
    "items": [
      {
        "bookId": "book_id_123",
        "bookTitle": "The Great Gatsby",
        "quantity": 2,
        "price": 15.99
      }
    ],
    "totalAmount": 31.98,
    "status": "completed",
    "shippingAddress": "123 Main St, City, State 12345",
    "createdAt": "2026-05-25T12:00:00.000Z"
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized

---

### Admin Endpoints

#### Get All Users

Retrieve all registered users (admin only).

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (Admin)

**Response:** `200 OK`
```json
[
  {
    "$id": "user_id_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "555-0123",
    "address": "123 Main St"
  },
  {
    "$id": "user_id_456",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "phone": "555-0124"
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)

---

#### Get All Books (Admin)

Retrieve all books with admin metadata.

**Endpoint:** `GET /api/admin/books`

**Authentication:** Required (Admin)

**Response:** `200 OK`
```json
[
  {
    "$id": "book_id_123",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "price": 15.99,
    "stock": 50,
    "description": "A classic American novel",
    "category": "Fiction",
    "publishedYear": 1925,
    "totalSold": 125,
    "revenue": 1998.75
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)

---

### Reports Endpoints

#### Get Sales Report

Retrieve comprehensive sales analytics (admin only).

**Endpoint:** `GET /api/reports/sales`

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter to date (ISO 8601)

**Example:**
```
GET /api/reports/sales?startDate=2026-01-01&endDate=2026-05-31
```

**Response:** `200 OK`
```json
{
  "totalSales": 12458.50,
  "totalOrders": 156,
  "averageOrderValue": 79.86,
  "topSellingBooks": [
    {
      "bookId": "book_id_123",
      "title": "The Great Gatsby",
      "totalSold": 45,
      "revenue": 719.55
    }
  ],
  "salesByMonth": [
    {
      "month": "January",
      "sales": 2340.50,
      "orders": 28
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)
- `400` - Invalid date format

---

#### Get Orders Report

Retrieve orders analytics (admin only).

**Endpoint:** `GET /api/reports/orders`

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional) - Filter by status
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response:** `200 OK`
```json
{
  "totalOrders": 156,
  "ordersByStatus": {
    "pending": 12,
    "processing": 8,
    "completed": 130,
    "cancelled": 6
  },
  "averageProcessingTime": "2.5 days",
  "recentOrders": [...]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)

---

## Data Models

### User

```typescript
interface User {
  $id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
}
```

### Book

```typescript
interface Book {
  $id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  publishedYear: number;
  imageUrl?: string;
}
```

### Order

```typescript
interface Order {
  $id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: string; // Encrypted
  createdAt: string;
}
```

### OrderItem

```typescript
interface OrderItem {
  bookId: string;
  bookTitle: string;
  quantity: number;
  price: number;
}
```

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "code": 400,
  "type": "bad_request"
}
```

### Common Error Codes

- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Not authenticated
- `403` - Forbidden: Not authorized for this action
- `404` - Not Found: Resource doesn't exist
- `409` - Conflict: Resource already exists or conflict
- `500` - Internal Server Error: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **Read endpoints**: 100 requests per minute
- **Write endpoints**: 30 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622548800
```

## Encryption

### AES-256-GCM

Sensitive fields are encrypted using AES-256-GCM:

- Shipping addresses
- Payment information (if applicable)

**Encryption Flow:**
1. Client generates session key
2. Data is encrypted client-side
3. Encrypted data is sent to server
4. Server stores encrypted data
5. Client decrypts when retrieved

**Implementation:**
```typescript
import { encrypt, decrypt, getSessionKey } from './lib/encryption';

// Encrypt before sending
const key = await getSessionKey();
const encrypted = await encrypt(sensitiveData, key);

// Decrypt after receiving
const decrypted = await decrypt(encrypted, key);
```

## Webhooks (Future)

Webhook support for real-time notifications:

**Events:**
- `order.created`
- `order.status_changed`
- `book.stock_low`
- `user.registered`

## Testing

### Example Request (cURL)

```bash
# Login
curl -X POST https://cloud.appwrite.io/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get Books
curl -X GET https://cloud.appwrite.io/v1/api/books \
  -H "Content-Type: application/json" \
  --cookie "session=..."
```

### Example Request (JavaScript)

```javascript
// Using the API service
import { api } from './lib/api';

// Login
const user = await api.login('user@example.com', 'password123');

// Get books
const books = await api.getBooks('gatsby', 'Fiction');

// Create order
const order = await api.createOrder(items, shippingAddress);
```

## Versioning

Current API Version: `v1`

Future versions will be accessible via:
```
/v2/api/...
```

Old versions will be maintained for 6 months after new version release.

## Support

For API issues or questions:
- Documentation: This file
- GitHub Issues: Repository issues page
- Email: support@bookstore.example.com

---

**Last Updated:** June 1, 2026  
**Version:** 1.0.0
