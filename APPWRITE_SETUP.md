# Appwrite Backend Setup Guide

This guide will help you set up the Appwrite backend for the Online Bookstore Management System.

## Quick Start

### 1. Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) or use your self-hosted instance
2. Create a new project
3. Note your Project ID and Endpoint

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
```

### 3. Set Up Authentication

In your Appwrite console:

1. Go to **Auth** section
2. Enable **Email/Password** authentication method
3. (Optional) Configure email templates for verification

### 4. Create Database (Optional but Recommended)

To replace mock data with real database:

#### Step 1: Create Database

1. Go to **Databases** in Appwrite Console
2. Click **Create Database**
3. Name it `bookstore`
4. Copy the Database ID

#### Step 2: Create Collections

Create the following collections:

##### Books Collection

**Collection ID:** `books`

**Attributes:**
- `title` - String (required, 256 chars)
- `author` - String (required, 256 chars)
- `isbn` - String (required, 20 chars)
- `price` - Float (required)
- `stock` - Integer (required)
- `description` - String (required, 2000 chars)
- `category` - String (required, 100 chars)
- `publishedYear` - Integer (required)
- `imageUrl` - String (optional, 512 chars)

**Indexes:**
- `title` - Fulltext index for search
- `category` - Index for filtering
- `author` - Index for filtering

**Permissions:**
- Read access: Role: any
- Create/Update/Delete access: Role: admin

##### Orders Collection

**Collection ID:** `orders`

**Attributes:**
- `userId` - String (required, relationship to users)
- `items` - String (required, JSON encoded, 5000 chars)
- `totalAmount` - Float (required)
- `status` - String (required, 20 chars) - enum: pending, processing, completed, cancelled
- `shippingAddress` - String (required, encrypted, 1000 chars)
- `createdAt` - DateTime (required)

**Indexes:**
- `userId` - Index for user's orders
- `status` - Index for filtering
- `createdAt` - Index for sorting

**Permissions:**
- Read access: Role: user (own documents only)
- Create access: Role: user
- Update/Delete access: Role: admin

#### Step 3: Update Environment Variables

Add to your `.env` file:

```env
VITE_APPWRITE_DATABASE_ID=bookstore
VITE_APPWRITE_BOOKS_COLLECTION_ID=books
VITE_APPWRITE_ORDERS_COLLECTION_ID=orders
```

### 5. Update API Implementation

Replace mock data in `/src/lib/api.ts` with real Appwrite queries:

```typescript
import { databases } from './appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BOOKS_COLLECTION = import.meta.env.VITE_APPWRITE_BOOKS_COLLECTION_ID;
const ORDERS_COLLECTION = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID;

// Example: Real implementation for getBooks
async getBooks(search?: string, category?: string): Promise<Book[]> {
  const queries = [Query.limit(100)];
  
  if (search) {
    queries.push(Query.search('title', search));
  }
  
  if (category) {
    queries.push(Query.equal('category', category));
  }

  const response = await databases.listDocuments(
    DATABASE_ID,
    BOOKS_COLLECTION,
    queries
  );

  return response.documents as unknown as Book[];
}

// Example: Real implementation for createOrder
async createOrder(items: OrderItem[], shippingAddress: string): Promise<Order> {
  const user = await this.getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Encrypt sensitive data
  const key = await getSessionKey();
  const encryptedAddress = await encrypt(shippingAddress, key);

  const response = await databases.createDocument(
    DATABASE_ID,
    ORDERS_COLLECTION,
    ID.unique(),
    {
      userId: user.$id,
      items: JSON.stringify(items),
      totalAmount,
      status: 'pending',
      shippingAddress: encryptedAddress,
      createdAt: new Date().toISOString(),
    }
  );

  return {
    $id: response.$id,
    userId: response.userId,
    items: JSON.parse(response.items),
    totalAmount: response.totalAmount,
    status: response.status,
    shippingAddress: await decrypt(response.shippingAddress, key),
    createdAt: response.createdAt,
  };
}
```

## User Roles Setup

### Making a User Admin

1. Go to **Auth > Users** in Appwrite Console
2. Click on the user you want to make admin
3. Go to **Preferences** tab
4. Add/update JSON:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save

The app will automatically detect the admin role and show admin features.

## Security Configuration

### 1. API Keys (for Server-Side Operations)

If you need server-side operations:

1. Go to **API Keys** in Appwrite Console
2. Create a new API key
3. Set appropriate scopes
4. Store securely (never commit to git)

### 2. Functions (Optional)

For advanced features like payment processing:

1. Go to **Functions** in Appwrite Console
2. Create a new function
3. Deploy your server-side code
4. Configure execution permissions

## AES-256-GCM Encryption

The app uses client-side encryption for sensitive data:

### How It Works

1. **Key Generation**: A unique encryption key is generated per session
2. **Storage**: Key is stored in sessionStorage (cleared on logout)
3. **Encryption**: Data is encrypted before sending to Appwrite
4. **Decryption**: Data is decrypted when retrieved

### What's Encrypted

- Shipping addresses
- Payment information (if implemented)
- Any sensitive user data

### Implementation

See `/src/lib/encryption.ts` for the full implementation using Web Crypto API.

## Testing the Setup

### Test Authentication

```typescript
// Register a new user
await api.register('test@example.com', 'password123', 'Test User');

// Login
await api.login('test@example.com', 'password123');

// Get current user
const user = await api.getCurrentUser();
console.log(user);
```

### Test Database (if configured)

```typescript
// Get books
const books = await api.getBooks();
console.log(books);

// Create a book (admin only)
const newBook = await api.createBook({
  title: 'Test Book',
  author: 'Test Author',
  isbn: '123-456-789',
  price: 19.99,
  stock: 10,
  description: 'A test book',
  category: 'Fiction',
  publishedYear: 2024,
});
console.log(newBook);
```

## Deployment

### Environment Variables for Production

When deploying to production:

1. Set environment variables in your hosting platform
2. Never commit `.env` file to git
3. Use different Project IDs for development and production

### Recommended Hosting Platforms

- **Vercel**: Excellent React support, easy env vars
- **Netlify**: Simple deployment, good for static sites
- **Railway**: Full-stack support
- **Render**: Free tier available

### Example: Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_APPWRITE_ENDPOINT
vercel env add VITE_APPWRITE_PROJECT_ID
```

## Troubleshooting

### Common Issues

#### 1. CORS Error

**Problem:** "Access to fetch... has been blocked by CORS policy"

**Solution:**
1. Go to Appwrite Console > Settings
2. Add your frontend URL to "Platforms"
3. For web app, add: `http://localhost:5173` (development) and your production URL

#### 2. Authentication Fails

**Problem:** Login/Register not working

**Solution:**
1. Verify Email/Password auth is enabled in Appwrite
2. Check Project ID matches in `.env`
3. Ensure CORS is configured

#### 3. Database Not Found

**Problem:** "Database not found" error

**Solution:**
1. Verify database was created
2. Check Database ID in `.env`
3. Ensure collection IDs match

#### 4. Permission Denied

**Problem:** "Permission denied" when accessing data

**Solution:**
1. Check collection permissions in Appwrite
2. Verify user role (admin vs user)
3. Ensure user is authenticated

### Debug Mode

Enable debug logging:

```typescript
// In /src/lib/appwrite.ts
import { Client } from 'appwrite';

const client = new Client()
  .setEndpoint(...)
  .setProject(...)
  .setLocale('en-US'); // Optional: Set locale

// Enable logging in development
if (import.meta.env.DEV) {
  console.log('Appwrite Config:', {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    project: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  });
}
```

## Advanced Features

### 1. Real-time Subscriptions

Monitor changes in real-time:

```typescript
import { client } from './lib/appwrite';

client.subscribe('databases.[DATABASE_ID].collections.[COLLECTION_ID].documents', response => {
  console.log('Document updated:', response.payload);
  // Update UI accordingly
});
```

### 2. File Storage

For book covers:

```typescript
import { Storage } from 'appwrite';

const storage = new Storage(client);

// Upload cover image
const file = await storage.createFile(
  'book-covers',
  ID.unique(),
  coverFile
);

// Get image URL
const imageUrl = storage.getFileView('book-covers', file.$id);
```

### 3. Server Functions

For complex operations:

```javascript
// In Appwrite Function
module.exports = async ({ req, res, log, error }) => {
  const { bookId, quantity } = JSON.parse(req.body);
  
  // Update stock
  // Process payment
  // Send confirmation email
  
  return res.json({ success: true });
};
```

## Support

For issues and questions:

- **Appwrite Docs**: https://appwrite.io/docs
- **Discord**: https://appwrite.io/discord
- **GitHub**: https://github.com/appwrite/appwrite

## Next Steps

1. ✅ Set up Appwrite project
2. ✅ Configure environment variables
3. ✅ Enable authentication
4. ⬜ Create database and collections
5. ⬜ Seed initial data
6. ⬜ Test all endpoints
7. ⬜ Deploy to production

Happy coding! 🚀
