# Online Bookstore Management System

A full-featured online bookstore management system built with React, TypeScript, Appwrite, and AES-256-GCM encryption.

## 🚀 Quick Start

**Want to get started immediately?** See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide!

## Features

### Authentication & Security
- **User Registration & Login** - Secure authentication with Appwrite
- **AES-256-GCM Encryption** - All sensitive data is encrypted using Web Crypto API
- **Role-based Access Control** - Admin and User roles with different permissions
- **Password Management** - Secure password change functionality

### User Features
- **Book Catalog** - Browse books with search and category filters
- **Book Details** - View detailed information about each book
- **Shopping Cart** - Add books to cart and manage quantities
- **Order Management** - Create and view order history
- **User Profile** - Update personal information and shipping address

### Admin Features
- **Dashboard** - Overview with sales analytics and charts
- **Book Management** - Create, update, and delete books
- **Order Management** - View and manage all orders
- **User Management** - View all registered users
- **Sales Reports** - Detailed sales analytics and top-selling books

## API Endpoints Implemented

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Profile & User Management
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Books
- `POST /api/books` - Create book (admin only)
- `GET /api/books` - Get all books with filters
- `GET /api/books/{book_id}` - Get book by ID
- `PUT /api/books/{book_id}` - Update book (admin only)
- `DELETE /api/books/{book_id}` - Delete book (admin only)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/{order_id}` - Get order by ID
- `GET /api/orders/user/{user_id}` - Get user orders

### Admin & Reporting
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/books` - Get all books for admin
- `GET /api/reports/sales` - Get sales report (admin only)
- `GET /api/reports/orders` - Get orders report (admin only)

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **Backend**: Appwrite
- **Encryption**: Web Crypto API (AES-256-GCM)
- **UI Components**: Radix UI + Custom Components
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Form Handling**: React Hook Form
- **Notifications**: Sonner

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Appwrite

1. Create an account at [Appwrite Cloud](https://cloud.appwrite.io)
2. Create a new project
3. Copy your Project ID and Endpoint
4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Update the `.env` file with your Appwrite credentials:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
```

### 3. Set Up Appwrite Database (Optional for Full Backend)

If you want to use Appwrite database instead of mock data:

1. In Appwrite Console, create a new database
2. Create collections for:
   - **books** - Store book information
   - **orders** - Store order information
   
3. Set up the following attributes:

**Books Collection:**
- `title` (string)
- `author` (string)
- `isbn` (string)
- `price` (float)
- `stock` (integer)
- `description` (string)
- `category` (string)
- `publishedYear` (integer)

**Orders Collection:**
- `userId` (string)
- `items` (string - JSON encoded)
- `totalAmount` (float)
- `status` (string)
- `shippingAddress` (string - encrypted)
- `createdAt` (datetime)

4. Update collection IDs in `.env`:

```env
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_BOOKS_COLLECTION_ID=books
VITE_APPWRITE_ORDERS_COLLECTION_ID=orders
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Default Users

The application currently uses mock data. To test admin features:

1. Register a new user
2. Manually update the user's role to 'admin' in Appwrite Console (User > Preferences > role: "admin")
3. Or modify the code in `/src/lib/api.ts` to default new users to admin role during development

## Security Features

### AES-256-GCM Encryption

All sensitive data (such as shipping addresses) is encrypted using:
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits
- **IV Length**: 96 bits (12 bytes)
- **Implementation**: Web Crypto API (browser native)

The encryption key is:
- Generated per session
- Stored in sessionStorage
- Cleared on logout
- Never sent to the server

### Usage Example

```typescript
import { encrypt, decrypt, getSessionKey } from './lib/encryption';

// Encrypt sensitive data
const key = await getSessionKey();
const encrypted = await encrypt(sensitiveData, key);

// Decrypt when needed
const decrypted = await decrypt(encrypted, key);
```

## Project Structure

```
/src
  /app
    /components
      /ui              # Reusable UI components
    App.tsx           # Main application component
    routes.tsx        # Route configuration
  /contexts
    AuthContext.tsx   # Authentication context
  /lib
    api.ts           # API service layer
    appwrite.ts      # Appwrite client configuration
    encryption.ts    # AES-256-GCM encryption utilities
  /pages
    Login.tsx        # Login page
    Register.tsx     # Registration page
    Books.tsx        # Book catalog
    BookDetail.tsx   # Book detail page
    Profile.tsx      # User profile
    Orders.tsx       # Order history
    Admin.tsx        # Admin dashboard
```

## Development Notes

### Current Implementation

The app currently uses **mock data** for demonstration. To connect to a real Appwrite backend:

1. Update the API methods in `/src/lib/api.ts` to use Appwrite SDK calls
2. Replace mock data with actual database queries
3. Set up proper Appwrite collections and indexes

### Adding Real Database Integration

Example of updating a method to use real Appwrite:

```typescript
async getBooks(search?: string, category?: string): Promise<Book[]> {
  const queries = [];
  
  if (search) {
    queries.push(Query.search('title', search));
  }
  
  if (category) {
    queries.push(Query.equal('category', category));
  }

  const response = await databases.listDocuments(
    VITE_APPWRITE_DATABASE_ID,
    VITE_APPWRITE_BOOKS_COLLECTION_ID,
    queries
  );

  return response.documents as Book[];
}
```

## Admin Access

To access admin features:
1. Navigate to `/admin` after logging in
2. Only users with `role: 'admin'` can access this page
3. Admin features include:
   - Sales dashboard with charts
   - Book CRUD operations
   - Order management
   - User management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Browser Support

- Chrome/Edge 87+
- Firefox 78+
- Safari 14+

(All browsers with Web Crypto API support)

## License

MIT