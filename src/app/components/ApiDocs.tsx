import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';

import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface EndpointGroup {
  title: string;
  description: string;
  endpoints: Array<{
    method: HttpMethod;
    path: string;
    auth: 'none' | 'user' | 'admin';
    summary: string;
    request?: string;
    response: string;
  }>;
}

const BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL ?? 'https://<bookstore-api-function-domain>/api',
).replace(/\/+$/g, '');

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

const AUTH_STYLES = {
  none: 'bg-slate-100 text-slate-700',
  user: 'bg-blue-100 text-blue-700',
  admin: 'bg-rose-100 text-rose-700',
};

const GROUPS: EndpointGroup[] = [
  {
    title: 'Auth',
    description: 'Server endpoints exist for non-browser clients. The browser UI signs in directly with Appwrite and then calls the Function with Appwrite JWT bearer tokens.',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/register',
        auth: 'none',
        summary: 'Create an Appwrite user account.',
        request: `{
  "email": "reader@example.com",
  "password": "password123",
  "name": "Reader One"
}`,
        response: `{
  "$id": "user_abc123",
  "name": "Reader One",
  "email": "reader@example.com",
  "role": "user"
}`,
      },
      {
        method: 'POST',
        path: '/auth/login',
        auth: 'none',
        summary: 'Create an Appwrite email/password session.',
        request: `{
  "email": "reader@example.com",
  "password": "password123"
}`,
        response: `{
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
}`,
      },
      {
        method: 'POST',
        path: '/auth/logout',
        auth: 'user',
        summary: 'Delete the current Appwrite session represented by the JWT.',
        response: `204 No Content`,
      },
      {
        method: 'GET',
        path: '/auth/me',
        auth: 'user',
        summary: 'Return the authenticated user with Appwrite-backed profile fields.',
        response: `{
  "$id": "user_abc123",
  "name": "Reader One",
  "email": "reader@example.com",
  "role": "user",
  "phone": "+15555550123",
  "address": "123 Main St"
}`,
      },
    ],
  },
  {
    title: 'Users',
    description: 'Profile data is stored in Appwrite TablesDB. Address fields are encrypted at rest with AES-256-GCM.',
    endpoints: [
      {
        method: 'GET',
        path: '/users/profile',
        auth: 'user',
        summary: 'Return the authenticated user profile.',
        response: `{
  "$id": "user_abc123",
  "name": "Reader One",
  "email": "reader@example.com",
  "role": "user",
  "phone": "+15555550123",
  "address": "123 Main St"
}`,
      },
      {
        method: 'PUT',
        path: '/users/profile',
        auth: 'user',
        summary: 'Update Appwrite name plus Appwrite-backed phone and address.',
        request: `{
  "name": "Reader Updated",
  "phone": "+15555550123",
  "address": "123 Main St"
}`,
        response: `{
  "$id": "user_abc123",
  "name": "Reader Updated",
  "email": "reader@example.com",
  "role": "user",
  "phone": "+15555550123",
  "address": "123 Main St"
}`,
      },
      {
        method: 'PUT',
        path: '/users/change-password',
        auth: 'user',
        summary: 'Change the authenticated Appwrite password.',
        request: `{
  "oldPassword": "password123",
  "newPassword": "new-password-456"
}`,
        response: `204 No Content`,
      },
    ],
  },
  {
    title: 'Books',
    description: 'Book catalog data is stored in Appwrite TablesDB. Reads require a valid Appwrite JWT. Writes are admin-only.',
    endpoints: [
      {
        method: 'GET',
        path: '/books',
        auth: 'user',
        summary: 'List books. Supports ?search= and ?category=.',
        response: `[
  {
    "$id": "book_abc123",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "price": 15.99,
    "stock": 50,
    "category": "Fiction",
    "rating": 4.2,
    "reviewCount": 4821,
    "discount": 10
  }
]`,
      },
      {
        method: 'GET',
        path: '/books/{bookId}',
        auth: 'user',
        summary: 'Get a single book.',
        response: `{
  "$id": "book_abc123",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "price": 15.99,
  "stock": 50
}`,
      },
      {
        method: 'POST',
        path: '/books',
        auth: 'admin',
        summary: 'Create a book.',
        request: `{
  "title": "Dune",
  "author": "Frank Herbert",
  "isbn": "9780441013593",
  "price": 19.99,
  "stock": 12,
  "description": "Science fiction classic",
  "category": "Science Fiction",
  "publishedYear": 1965
}`,
        response: `{
  "$id": "book_new123",
  "title": "Dune",
  "author": "Frank Herbert"
}`,
      },
      {
        method: 'PUT',
        path: '/books/{bookId}',
        auth: 'admin',
        summary: 'Update a book.',
        request: `{
  "stock": 10,
  "price": 17.99
}`,
        response: `{
  "$id": "book_abc123",
  "stock": 10,
  "price": 17.99
}`,
      },
      {
        method: 'DELETE',
        path: '/books/{bookId}',
        auth: 'admin',
        summary: 'Delete a book.',
        response: `204 No Content`,
      },
    ],
  },
  {
    title: 'Orders',
    description: 'Order totals are recomputed from stored book data. Client-supplied pricing is ignored.',
    endpoints: [
      {
        method: 'POST',
        path: '/orders',
        auth: 'user',
        summary: 'Create an order. Shipping address is encrypted server-side with AES-256-GCM.',
        request: `{
  "items": [
    { "bookId": "book_abc123", "quantity": 2 }
  ],
  "shippingAddress": "456 Oak Ave"
}`,
        response: `{
  "$id": "order_abc123",
  "userId": "user_abc123",
  "items": [
    {
      "bookId": "book_abc123",
      "bookTitle": "The Great Gatsby",
      "quantity": 2,
      "price": 14.39
    }
  ],
  "totalAmount": 28.78,
  "status": "pending",
  "shippingAddress": "456 Oak Ave",
  "trackingNumber": "TRKABC123456"
}`,
      },
      {
        method: 'GET',
        path: '/orders/{orderId}',
        auth: 'user',
        summary: 'Get a single order. Users can only read their own order unless they are admin.',
        response: `{
  "$id": "order_abc123",
  "status": "pending",
  "shippingAddress": "456 Oak Ave"
}`,
      },
      {
        method: 'GET',
        path: '/orders/user/{userId}',
        auth: 'user',
        summary: 'List orders for one user.',
        response: `[
  {
    "$id": "order_abc123",
    "status": "completed",
    "totalAmount": 28.78
  }
]`,
      },
    ],
  },
  {
    title: 'Admin',
    description: 'Admin routes require `prefs.role = "admin"` on the Appwrite user.',
    endpoints: [
      {
        method: 'GET',
        path: '/admin/users',
        auth: 'admin',
        summary: 'List users merged with Appwrite-backed profile data.',
        response: `[
  {
    "$id": "user_abc123",
    "name": "Reader One",
    "email": "reader@example.com",
    "role": "user",
    "phone": "+15555550123"
  }
]`,
      },
      {
        method: 'GET',
        path: '/admin/books',
        auth: 'admin',
        summary: 'List books plus computed totalSold and revenue.',
        response: `[
  {
    "$id": "book_abc123",
    "title": "The Great Gatsby",
    "totalSold": 42,
    "revenue": 604.38
  }
]`,
      },
      {
        method: 'GET',
        path: '/admin/orders',
        auth: 'admin',
        summary: 'List all orders.',
        response: `[
  {
    "$id": "order_abc123",
    "userId": "user_abc123",
    "status": "processing",
    "shippingAddress": "456 Oak Ave"
  }
]`,
      },
      {
        method: 'PATCH',
        path: '/admin/orders/{orderId}/status',
        auth: 'admin',
        summary: 'Update order status.',
        request: `{
  "status": "processing"
}`,
        response: `{
  "$id": "order_abc123",
  "status": "processing"
}`,
      },
    ],
  },
  {
    title: 'Reports',
    description: 'Aggregate reporting endpoints built from Appwrite book and order data.',
    endpoints: [
      {
        method: 'GET',
        path: '/reports/sales',
        auth: 'admin',
        summary: 'Get sales totals, monthly buckets, and top-selling books.',
        response: `{
  "totalSales": 28458.5,
  "totalOrders": 356,
  "averageOrderValue": 79.94,
  "topSellingBooks": [],
  "salesByMonth": []
}`,
      },
      {
        method: 'GET',
        path: '/reports/orders',
        auth: 'admin',
        summary: 'Get order counts by status and recent orders.',
        response: `{
  "totalOrders": 356,
  "ordersByStatus": {
    "pending": 12,
    "processing": 8,
    "shipped": 21,
    "completed": 309,
    "cancelled": 6
  },
  "averageProcessingTime": null,
  "recentOrders": []
}`,
      },
      {
        method: 'GET',
        path: '/reports/inventory',
        auth: 'admin',
        summary: 'Get total books, low-stock, and out-of-stock sets. Supports ?lowStockThreshold=.',
        response: `{
  "totalBooks": 64,
  "lowStock": [],
  "outOfStock": []
}`,
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-white/10 transition-colors">
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}

function EndpointCard({
  method,
  path,
  auth,
  summary,
  request,
  response,
}: EndpointGroup['endpoints'][number]) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${BASE_URL}${path}`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen(current => !current)}
      >
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-mono ${METHOD_STYLES[method]}`}>
          {method}
        </span>
        <code className="text-sm flex-1 truncate">{path}</code>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded ${AUTH_STYLES[auth]}`}>
          {auth === 'none' ? 'public' : auth}
        </span>
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-4 bg-muted/20 text-sm">
          <p className="text-muted-foreground">{summary}</p>

          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-xs">
            <span className={`shrink-0 px-1.5 py-0.5 rounded ${METHOD_STYLES[method]}`}>{method}</span>
            <span className="flex-1 truncate">{fullUrl}</span>
            <CopyButton text={`${method} ${fullUrl}`} />
          </div>

          {request && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Request</p>
                <CopyButton text={request} />
              </div>
              <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-xs rounded-md p-3 overflow-x-auto">
                {request}
              </pre>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Response</p>
              <CopyButton text={response} />
            </div>
            <pre className="bg-[#1e1e2e] text-[#cdd6f4] text-xs rounded-md p-3 overflow-x-auto">
              {response}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiDocs() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Auth: true,
    Books: true,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5 bg-gradient-to-r from-primary/5 to-background">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl">Bookstore Function API</h2>
          <Badge variant="secondary">v1</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-0">TablesDB + Appwrite</Badge>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 font-mono text-sm">
          <span className="text-muted-foreground flex-1 truncate">{BASE_URL}</span>
          <CopyButton text={BASE_URL} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>HTTPS only</span>
          <span>Authorization: Bearer &lt;Appwrite JWT&gt;</span>
          <span>AES-256-GCM at rest for addresses</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 text-sm space-y-2">
          <p className="font-medium">Frontend to backend auth</p>
          <p className="text-muted-foreground">
            The browser signs in directly with Appwrite, then creates a short-lived JWT per request. Protected Function routes expect:
          </p>
          <div className="flex items-center gap-2 bg-[#1e1e2e] text-[#cdd6f4] rounded-md px-3 py-2 font-mono text-xs">
            <span className="flex-1">Authorization: Bearer &lt;appwrite-user-jwt&gt;</span>
            <CopyButton text="Authorization: Bearer <appwrite-user-jwt>" />
          </div>
        </CardContent>
      </Card>

      {GROUPS.map(group => (
        <Card key={group.title}>
          <CardHeader
            className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3"
            onClick={() => setOpenGroups(current => ({
              ...current,
              [group.title]: !current[group.title],
            }))}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <span>{group.title}</span>
                <Badge variant="outline" className="text-xs">{group.endpoints.length}</Badge>
              </div>
              {openGroups[group.title]
                ? <ChevronDown className="size-4 text-muted-foreground" />
                : <ChevronRight className="size-4 text-muted-foreground" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </CardHeader>

          {openGroups[group.title] && (
            <CardContent className="space-y-2 pt-0">
              {group.endpoints.map(endpoint => (
                <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
