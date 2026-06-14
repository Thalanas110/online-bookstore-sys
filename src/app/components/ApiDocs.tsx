import { useState } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface Endpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  auth: 'none' | 'user' | 'admin';
  params?: Param[];
  body?: Param[];
  response: string;
}

interface Group {
  tag: string;
  description: string;
  endpoints: Endpoint[];
}

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

const AUTH_LABEL: Record<string, { label: string; color: string }> = {
  none: { label: 'Public', color: 'bg-gray-100 text-gray-600' },
  user: { label: 'Auth required', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'Admin only', color: 'bg-purple-100 text-purple-700' },
};

const BASE_URL = 'https://api.pageturn.com/v1';

const API_GROUPS: Group[] = [
  {
    tag: 'Authentication',
    description: 'Register, log in, log out, and inspect the current session.',
    endpoints: [
      {
        method: 'POST', path: '/auth/register', auth: 'none',
        summary: 'Register a new user',
        description: 'Creates a new user account and starts a session automatically.',
        body: [
          { name: 'name', type: 'string', required: true, description: 'Full display name' },
          { name: 'email', type: 'string', required: true, description: 'Unique email address' },
          { name: 'password', type: 'string', required: true, description: 'Min 8 characters' },
        ],
        response: `{ "$id": "user_abc123", "name": "Jane Doe", "email": "jane@example.com", "role": "user" }`,
      },
      {
        method: 'POST', path: '/auth/login', auth: 'none',
        summary: 'Log in',
        description: 'Authenticates the user and returns a session token.',
        body: [
          { name: 'email', type: 'string', required: true, description: 'Registered email' },
          { name: 'password', type: 'string', required: true, description: 'Account password' },
        ],
        response: `{ "$id": "user_abc123", "name": "Jane Doe", "email": "jane@example.com", "role": "user", "token": "eyJhbGci..." }`,
      },
      {
        method: 'POST', path: '/auth/logout', auth: 'user',
        summary: 'Log out',
        description: 'Invalidates the current session token.',
        response: `{ "success": true }`,
      },
      {
        method: 'GET', path: '/auth/me', auth: 'user',
        summary: 'Get current user',
        description: 'Returns the profile of the currently authenticated user.',
        response: `{ "$id": "user_abc123", "name": "Jane Doe", "email": "jane@example.com", "role": "user", "phone": "555-0100", "address": "123 Main St" }`,
      },
    ],
  },
  {
    tag: 'Users',
    description: 'Manage user profiles and preferences.',
    endpoints: [
      {
        method: 'GET', path: '/users/me', auth: 'user',
        summary: 'Get own profile',
        description: 'Returns the full profile of the currently authenticated user including preferences.',
        response: `{ "$id": "user_abc123", "name": "Jane Doe", "email": "jane@example.com", "role": "user", "phone": "555-0100", "address": "AES-256-GCM encrypted" }`,
      },
      {
        method: 'PUT', path: '/users/me', auth: 'user',
        summary: 'Update own profile',
        description: 'Updates name, phone, or shipping address. Shipping address is stored AES-256-GCM encrypted.',
        body: [
          { name: 'name', type: 'string', description: 'New display name' },
          { name: 'phone', type: 'string', description: 'Phone number' },
          { name: 'address', type: 'string', description: 'Shipping address (encrypted at rest)' },
        ],
        response: `{ "$id": "user_abc123", "name": "Jane Doe Updated", ... }`,
      },
      {
        method: 'PUT', path: '/users/me/password', auth: 'user',
        summary: 'Change password',
        description: 'Updates the user password. Requires the current password for verification.',
        body: [
          { name: 'currentPassword', type: 'string', required: true, description: 'Existing password' },
          { name: 'newPassword', type: 'string', required: true, description: 'New password (min 8 chars)' },
        ],
        response: `{ "success": true }`,
      },
      {
        method: 'GET', path: '/admin/users', auth: 'admin',
        summary: 'List all users',
        description: 'Returns a paginated list of all registered users. Admin only.',
        params: [
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Items per page (default: 20, max: 100)' },
          { name: 'role', type: 'string', description: 'Filter by role: user | admin' },
        ],
        response: `{ "data": [...], "total": 128, "page": 1, "limit": 20 }`,
      },
    ],
  },
  {
    tag: 'Books',
    description: 'Browse, search, and manage the book catalog.',
    endpoints: [
      {
        method: 'GET', path: '/books', auth: 'none',
        summary: 'List books',
        description: 'Returns a paginated list of books with optional filtering and sorting.',
        params: [
          { name: 'search', type: 'string', description: 'Full-text search on title and author' },
          { name: 'category', type: 'string', description: 'Filter by category slug' },
          { name: 'sort', type: 'string', description: 'One of: featured | price_asc | price_desc | rating | newest' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Items per page (default: 20)' },
        ],
        response: `{ "data": [{ "$id": "1", "title": "...", "author": "...", "price": 15.99, "rating": 4.2, ... }], "total": 64 }`,
      },
      {
        method: 'GET', path: '/books/:id', auth: 'none',
        summary: 'Get a book',
        description: 'Returns the full details of a single book by its ID.',
        response: `{ "$id": "1", "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "isbn": "978-...", "price": 15.99, "stock": 50, "rating": 4.2, "reviewCount": 4821, ... }`,
      },
      {
        method: 'POST', path: '/books', auth: 'admin',
        summary: 'Create a book',
        description: 'Adds a new book to the catalog. Admin only.',
        body: [
          { name: 'title', type: 'string', required: true, description: 'Book title' },
          { name: 'author', type: 'string', required: true, description: 'Author name' },
          { name: 'isbn', type: 'string', required: true, description: 'ISBN-13 format' },
          { name: 'price', type: 'number', required: true, description: 'Price in USD' },
          { name: 'stock', type: 'number', required: true, description: 'Initial stock count' },
          { name: 'category', type: 'string', required: true, description: 'Category name' },
          { name: 'description', type: 'string', required: true, description: 'Book synopsis' },
          { name: 'publishedYear', type: 'number', required: true, description: 'Year of publication' },
          { name: 'imageUrl', type: 'string', description: 'Cover image URL' },
          { name: 'discount', type: 'number', description: 'Discount percentage (0–100)' },
          { name: 'isFeatured', type: 'boolean', description: 'Show in featured section' },
          { name: 'isBestseller', type: 'boolean', description: 'Show bestseller badge' },
        ],
        response: `{ "$id": "new_book_id", "title": "...", ... }`,
      },
      {
        method: 'PUT', path: '/books/:id', auth: 'admin',
        summary: 'Update a book',
        description: 'Updates one or more fields of an existing book. Admin only. All body fields are optional.',
        body: [
          { name: 'title', type: 'string', description: 'New title' },
          { name: 'price', type: 'number', description: 'New price' },
          { name: 'stock', type: 'number', description: 'Updated stock count' },
          { name: 'discount', type: 'number', description: 'New discount percentage' },
        ],
        response: `{ "$id": "1", "title": "...", "price": 12.99, ... }`,
      },
      {
        method: 'DELETE', path: '/books/:id', auth: 'admin',
        summary: 'Delete a book',
        description: 'Permanently removes a book from the catalog. Admin only.',
        response: `{ "success": true }`,
      },
    ],
  },
  {
    tag: 'Orders',
    description: 'Place and track customer orders.',
    endpoints: [
      {
        method: 'POST', path: '/orders', auth: 'user',
        summary: 'Create an order',
        description: 'Places a new order. The shipping address is AES-256-GCM encrypted before storage.',
        body: [
          { name: 'items', type: 'OrderItem[]', required: true, description: 'Array of { bookId, quantity }' },
          { name: 'shippingAddress', type: 'string', required: true, description: 'Delivery address (encrypted at rest)' },
          { name: 'promoCode', type: 'string', description: 'Optional promo code for a discount' },
        ],
        response: `{ "$id": "order_xyz", "status": "pending", "totalAmount": 32.98, "trackingNumber": "TRKABC123", "estimatedDelivery": "2026-06-08T..." }`,
      },
      {
        method: 'GET', path: '/orders', auth: 'user',
        summary: "List own orders",
        description: "Returns all orders belonging to the authenticated user, newest first.",
        params: [
          { name: 'status', type: 'string', description: 'Filter: pending | processing | shipped | completed | cancelled' },
          { name: 'page', type: 'number', description: 'Page number' },
        ],
        response: `{ "data": [...], "total": 12 }`,
      },
      {
        method: 'GET', path: '/orders/:id', auth: 'user',
        summary: 'Get an order',
        description: 'Returns a single order. Users can only access their own orders; admins can access any.',
        response: `{ "$id": "order_xyz", "status": "shipped", "items": [...], "shippingAddress": "...", "trackingNumber": "TRKABC123" }`,
      },
      {
        method: 'GET', path: '/admin/orders', auth: 'admin',
        summary: 'List all orders',
        description: 'Returns every order across all users. Admin only.',
        params: [
          { name: 'status', type: 'string', description: 'Filter by status' },
          { name: 'userId', type: 'string', description: 'Filter by user ID' },
          { name: 'page', type: 'number', description: 'Page number' },
        ],
        response: `{ "data": [...], "total": 356 }`,
      },
      {
        method: 'PATCH', path: '/admin/orders/:id/status', auth: 'admin',
        summary: 'Update order status',
        description: 'Changes the status of an order. Valid transitions: pending→processing→shipped→completed, any→cancelled.',
        body: [
          { name: 'status', type: 'string', required: true, description: 'pending | processing | shipped | completed | cancelled' },
        ],
        response: `{ "$id": "order_xyz", "status": "shipped", ... }`,
      },
    ],
  },
  {
    tag: 'Reports',
    description: 'Sales analytics and inventory reporting. Admin only.',
    endpoints: [
      {
        method: 'GET', path: '/admin/reports/sales', auth: 'admin',
        summary: 'Sales report',
        description: 'Returns aggregate sales stats, monthly breakdown, and top-selling books.',
        params: [
          { name: 'from', type: 'string', description: 'ISO 8601 start date (default: start of current year)' },
          { name: 'to', type: 'string', description: 'ISO 8601 end date (default: today)' },
        ],
        response: `{ "totalSales": 28458.50, "totalOrders": 356, "averageOrderValue": 79.94, "topSellingBooks": [...], "salesByMonth": [...] }`,
      },
      {
        method: 'GET', path: '/admin/reports/inventory', auth: 'admin',
        summary: 'Inventory report',
        description: 'Returns stock levels across all books, flagging low-stock items.',
        params: [
          { name: 'lowStockThreshold', type: 'number', description: 'Units threshold to flag as low stock (default: 10)' },
        ],
        response: `{ "totalBooks": 64, "lowStock": [{ "$id": "5", "title": "...", "stock": 3 }], "outOfStock": [...] }`,
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-white/10 transition-colors">
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}

function EndpointRow({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const auth = AUTH_LABEL[ep.auth];
  const fullPath = `${BASE_URL}${ep.path}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-mono ${METHOD_COLOR[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm flex-1 truncate">{ep.path}</code>
        <span className="hidden sm:block text-xs text-muted-foreground flex-1 truncate">{ep.summary}</span>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded ${auth.color}`}>{auth.label}</span>
        {open ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-4 bg-muted/20 text-sm">
          {/* Full URL */}
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-xs">
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
            <span className="flex-1 truncate">{fullPath}</span>
            <CopyButton text={`${ep.method} ${fullPath}`} />
          </div>

          <p className="text-muted-foreground">{ep.description}</p>

          {ep.params && ep.params.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Query Parameters</p>
              <div className="space-y-1">
                {ep.params.map(p => (
                  <div key={p.name} className="flex items-start gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                    <span className="text-xs text-blue-600 shrink-0">{p.type}</span>
                    {p.required && <span className="text-xs text-red-500 shrink-0">required</span>}
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ep.body && ep.body.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Request Body (JSON)</p>
              <div className="space-y-1">
                {ep.body.map(p => (
                  <div key={p.name} className="flex items-start gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">{p.name}</code>
                    <span className="text-xs text-blue-600 shrink-0">{p.type}</span>
                    {p.required && <span className="text-xs text-red-500 shrink-0">required</span>}
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Response (200 OK)</p>
              <CopyButton text={ep.response} />
            </div>
            <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-xs rounded-md p-3 overflow-x-auto">
              {ep.response}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiDocs() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Authentication: true });

  function toggleGroup(tag: string) {
    setOpenGroups(prev => ({ ...prev, [tag]: !prev[tag] }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border p-5 bg-gradient-to-r from-primary/5 to-background">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl">PageTurn REST API</h2>
          <Badge variant="secondary">v1</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-0">Live</Badge>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-sm max-w-sm">
          <span className="text-muted-foreground flex-1">{BASE_URL}</span>
          <CopyButton text={BASE_URL} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>🔒 HTTPS only</span>
          <span>📦 JSON request &amp; response</span>
          <span>🔑 Bearer token auth</span>
          <span>🔐 AES-256-GCM encrypted fields</span>
        </div>
      </div>

      {/* Auth note */}
      <Card>
        <CardContent className="p-4 text-sm space-y-2">
          <p className="font-medium">Authentication</p>
          <p className="text-muted-foreground">
            Include the session token from <code className="bg-muted px-1 rounded">/auth/login</code> in the{' '}
            <code className="bg-muted px-1 rounded">Authorization</code> header:
          </p>
          <div className="flex items-center gap-2 bg-[#1e1e2e] text-[#cdd6f4] rounded-md px-3 py-2 font-mono text-xs">
            <span className="flex-1">Authorization: Bearer eyJhbGci...</span>
            <CopyButton text="Authorization: Bearer eyJhbGci..." />
          </div>
        </CardContent>
      </Card>

      {/* Endpoint groups */}
      {API_GROUPS.map(group => (
        <Card key={group.tag}>
          <CardHeader
            className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3"
            onClick={() => toggleGroup(group.tag)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span>{group.tag}</span>
                <Badge variant="outline" className="text-xs">{group.endpoints.length}</Badge>
              </div>
              {openGroups[group.tag]
                ? <ChevronDown className="size-4 text-muted-foreground" />
                : <ChevronRight className="size-4 text-muted-foreground" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </CardHeader>

          {openGroups[group.tag] && (
            <CardContent className="space-y-2 pt-0">
              {group.endpoints.map(ep => (
                <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
