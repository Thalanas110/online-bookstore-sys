import { ID } from 'appwrite';

import { getAccount } from './appwrite';

export interface Book {
  $id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  imageUrl?: string;
  publishedYear: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
}

export interface Order {
  $id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface User {
  $id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
}

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingBooks: Array<{ bookId: string; title: string; totalSold: number; revenue: number }>;
  salesByMonth: Array<{ month: string; sales: number; orders: number }>;
}

export interface OrdersReport {
  totalOrders: number;
  ordersByStatus: Record<Order['status'], number>;
  averageProcessingTime: number | null;
  recentOrders: Order[];
}

export interface InventoryReport {
  totalBooks: number;
  lowStock: Book[];
  outOfStock: Book[];
}

function normalizeBaseUrl(value: string, label: string) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const isLocal = localHosts.has(parsed.hostname);

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
    throw new Error(`${label} must use HTTPS unless it points to localhost`);
  }

  return parsed.toString().replace(/\/+$/g, '');
}

function readApiBaseUrl() {
  const raw = String(
    import.meta.env.VITE_API_BASE_URL
    ?? import.meta.env.VITE_APPWRITE_FUNCTION_URL
    ?? '',
  ).trim();

  if (!raw || raw.includes('YOUR_')) {
    throw new Error('Missing required environment variable: VITE_API_BASE_URL');
  }

  return normalizeBaseUrl(raw, 'VITE_API_BASE_URL');
}

function isUnauthorizedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = Number((error as { code?: number }).code);
  if (code === 401) {
    return true;
  }

  const message = String((error as { message?: string }).message ?? '').toLowerCase();
  return message.includes('unauthorized') || message.includes('missing scope') || message.includes('session');
}

async function createAccessToken() {
  const account = getAccount();
  const jwt = await account.createJWT({ duration: 900 });
  const token = jwt?.jwt;

  if (!token) {
    throw new Error('Failed to create Appwrite JWT for API request');
  }

  return token;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${readApiBaseUrl()}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

class APIService {
  private async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      auth?: boolean;
    } = {},
  ): Promise<T> {
    const headers = new Headers({
      Accept: 'application/json',
    });

    if (options.auth !== false) {
      headers.set('Authorization', `Bearer ${await createAccessToken()}`);
    }

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(payload?.message || `Request failed with status ${response.status}`);
    }

    return payload as T;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const account = getAccount();
    await account.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
    await account.createEmailPasswordSession({ email, password });

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Account created but profile could not be loaded');
    }

    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const account = getAccount();
    await account.createEmailPasswordSession({ email, password });

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Login succeeded but profile could not be loaded');
    }

    return user;
  }

  async logout(): Promise<void> {
    const account = getAccount();

    try {
      await account.deleteSession({ sessionId: 'current' });
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error;
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const account = getAccount();

    try {
      await account.get();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return null;
      }

      throw error;
    }

    return await this.request<User>('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return await this.request<User>('/users/profile', {
      method: 'PUT',
      body: {
        name: data.name,
        phone: data.phone,
        address: data.address,
      },
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request<void>('/users/change-password', {
      method: 'PUT',
      body: {
        oldPassword,
        newPassword,
      },
    });
  }

  async getBooks(search?: string, category?: string): Promise<Book[]> {
    return await this.request<Book[]>('/books', {
      query: { search, category },
    });
  }

  async getBook(bookId: string): Promise<Book | null> {
    return await this.request<Book>(`/books/${encodeURIComponent(bookId)}`);
  }

  async getFeaturedBooks(): Promise<Book[]> {
    return (await this.getBooks()).filter(book => Boolean(book.isFeatured));
  }

  async getBestsellers(): Promise<Book[]> {
    return (await this.getBooks()).filter(book => Boolean(book.isBestseller));
  }

  async createBook(book: Omit<Book, '$id'>): Promise<Book> {
    return await this.request<Book>('/books', {
      method: 'POST',
      body: book,
    });
  }

  async updateBook(bookId: string, updates: Partial<Book>): Promise<Book> {
    return await this.request<Book>(`/books/${encodeURIComponent(bookId)}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.request<void>(`/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    });
  }

  async createOrder(
    items: Array<Pick<OrderItem, 'bookId' | 'quantity'>>,
    shippingAddress: string,
  ): Promise<Order> {
    return await this.request<Order>('/orders', {
      method: 'POST',
      body: {
        items: items.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        shippingAddress,
      },
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return await this.request<Order>(`/orders/${encodeURIComponent(orderId)}`);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.request<Order[]>(`/orders/user/${encodeURIComponent(userId)}`);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.request<User[]>('/admin/users');
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.request<Order[]>('/admin/orders');
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return await this.request<Order>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }

  async getSalesReport(): Promise<SalesReport> {
    return await this.request<SalesReport>('/reports/sales');
  }

  async getOrdersReport(): Promise<OrdersReport> {
    return await this.request<OrdersReport>('/reports/orders');
  }

  async getInventoryReport(lowStockThreshold?: number): Promise<InventoryReport> {
    return await this.request<InventoryReport>('/reports/inventory', {
      query: {
        lowStockThreshold,
      },
    });
  }
}

export const api = new APIService();
