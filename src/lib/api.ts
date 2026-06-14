import { account } from './appwrite';
import { encrypt, getSessionKey } from './encryption';
import { ID } from 'appwrite';

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
}

export interface Order {
  $id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
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

const MOCK_BOOKS: Book[] = [
  {
    $id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565', price: 15.99, stock: 50,
    description: "Set in the Jazz Age on Long Island, this novel depicts narrator Nick Carraway's interactions with the mysterious millionaire Jay Gatsby and his obsession to reunite with his former lover, Daisy Buchanan. A timeless tale of wealth, class, and the American Dream.",
    category: 'Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
    publishedYear: 1925, rating: 4.2, reviewCount: 4821, isFeatured: true, isBestseller: true,
  },
  {
    $id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee',
    isbn: '978-0061120084', price: 18.99, stock: 35,
    description: "A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice. Winner of the Pulitzer Prize, Harper Lee's classic explores themes of racial injustice and childhood innocence.",
    category: 'Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=400&q=80',
    publishedYear: 1960, rating: 4.5, reviewCount: 7234, isFeatured: true, isBestseller: true,
  },
  {
    $id: '3', title: '1984', author: 'George Orwell',
    isbn: '978-0451524935', price: 16.99, stock: 45,
    description: "Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real. A visionary dystopia exploring totalitarianism and surveillance.",
    category: 'Science Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    publishedYear: 1949, rating: 4.6, reviewCount: 9102, isFeatured: true, isBestseller: true,
  },
  {
    $id: '4', title: 'The Hobbit', author: 'J.R.R. Tolkien',
    isbn: '978-0547928227', price: 14.99, stock: 60,
    description: "A magnificent tale of adventure. Bilbo Baggins, a hobbit who enjoys a comfortable life, is whisked away on an epic quest by the wizard Gandalf and a company of dwarves to reclaim their mountain home.",
    category: 'Fantasy',
    imageUrl: 'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=400&q=80',
    publishedYear: 1937, rating: 4.7, reviewCount: 11453, isFeatured: true, discount: 10,
  },
  {
    $id: '5', title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '978-0132350884', price: 42.99, stock: 25,
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. A handbook of agile software craftsmanship. A must-read for every professional developer.",
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&q=80',
    publishedYear: 2008, rating: 4.4, reviewCount: 3876, isBestseller: true,
  },
  {
    $id: '6', title: 'Dune', author: 'Frank Herbert',
    isbn: '978-0441013593', price: 19.99, stock: 40,
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice melange. A science fiction masterpiece.",
    category: 'Science Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1773352520531-3b2917e8efc1?w=400&q=80',
    publishedYear: 1965, rating: 4.8, reviewCount: 8903, isFeatured: true, isBestseller: true,
  },
  {
    $id: '7', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt',
    isbn: '978-0201616224', price: 49.99, stock: 18,
    description: "Straight from the programming trenches, this book cuts through the increasing specialization and technicalities of modern software development to examine the core process. Essential reading for modern developers.",
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1763562597716-68adb3f7f896?w=400&q=80',
    publishedYear: 1999, rating: 4.5, reviewCount: 2987,
  },
  {
    $id: '8', title: 'Pride and Prejudice', author: 'Jane Austen',
    isbn: '978-0141439518', price: 12.99, stock: 55,
    description: "Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language. Jane Austen's vivacious heroine has captured hearts worldwide.",
    category: 'Classic',
    imageUrl: 'https://images.unsplash.com/photo-1758279746549-d24f3784879d?w=400&q=80',
    publishedYear: 1813, rating: 4.3, reviewCount: 6521, discount: 15,
  },
  {
    $id: '9', title: 'The Alchemist', author: 'Paulo Coelho',
    isbn: '978-0062315007', price: 17.99, stock: 70,
    description: "Paulo Coelho's masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. A journey of self-discovery and wonder.",
    category: 'Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1772380407213-1ae5fed457d0?w=400&q=80',
    publishedYear: 1988, rating: 4.1, reviewCount: 12834, isBestseller: true,
  },
  {
    $id: '10', title: 'Atomic Habits', author: 'James Clear',
    isbn: '978-0735211292', price: 27.99, stock: 80,
    description: "A proven framework for improving every day. James Clear reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
    category: 'Self-Help',
    imageUrl: 'https://images.unsplash.com/photo-1769505352612-fe0e67fa2a8a?w=400&q=80',
    publishedYear: 2018, rating: 4.8, reviewCount: 21093, isFeatured: true, isBestseller: true,
  },
  {
    $id: '11', title: 'Sapiens', author: 'Yuval Noah Harari',
    isbn: '978-0062316097', price: 24.99, stock: 38,
    description: "A brief history of humankind. From the Stone Age to the Information Age, Sapiens is a sweeping historical narrative exploring how Homo sapiens came to dominate the Earth. Bold, wide-ranging, and provocative.",
    category: 'Non-Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=400&q=80',
    publishedYear: 2011, rating: 4.5, reviewCount: 15672, isBestseller: true,
  },
  {
    $id: '12', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling',
    isbn: '978-0590353427', price: 22.99, stock: 90,
    description: "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. This is where the magic begins — a journey into a world of wonder, friendship, and adventure.",
    category: 'Fantasy',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    publishedYear: 1997, rating: 4.9, reviewCount: 34521, isFeatured: true, isBestseller: true,
  },
  {
    $id: '13', title: 'The Lean Startup', author: 'Eric Ries',
    isbn: '978-0307887894', price: 29.99, stock: 22,
    description: "A new approach being adopted across the globe, changing the way companies are built and new products are launched. Ries offers a scientific approach to creating and managing successful startups in uncertainty.",
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&q=80',
    publishedYear: 2011, rating: 4.2, reviewCount: 5432,
  },
  {
    $id: '14', title: 'The Psychology of Money', author: 'Morgan Housel',
    isbn: '978-0857197689', price: 23.99, stock: 45,
    description: "Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know — it's about how you behave. And behavior is hard to teach, even to really smart people.",
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=400&q=80',
    publishedYear: 2020, rating: 4.7, reviewCount: 8901, isNew: true, isFeatured: true,
  },
  {
    $id: '15', title: 'Brave New World', author: 'Aldous Huxley',
    isbn: '978-0060850524', price: 14.99, stock: 33,
    description: "A masterful rendering of a future earth seduced by comfort and ease — a world in which the human spirit is devalued. Aldous Huxley's prophetic vision of genetic engineering and psychological manipulation.",
    category: 'Science Fiction',
    imageUrl: 'https://images.unsplash.com/photo-1773352520531-3b2917e8efc1?w=400&q=80',
    publishedYear: 1932, rating: 4.1, reviewCount: 6234,
  },
  {
    $id: '16', title: 'Think and Grow Rich', author: 'Napoleon Hill',
    isbn: '978-1585424337', price: 16.99, stock: 55,
    description: "Drawing on stories of Andrew Carnegie, Thomas Edison, Henry Ford, and other millionaires, Napoleon Hill teaches their secrets to success. A transformative classic on mindset and achievement.",
    category: 'Self-Help',
    imageUrl: 'https://images.unsplash.com/photo-1763562597716-68adb3f7f896?w=400&q=80',
    publishedYear: 1937, rating: 4.0, reviewCount: 9821,
  },
];

class APIService {
  private encryptionEnabled = true;

  async register(email: string, password: string, name: string): Promise<User> {
    const session = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    return { $id: session.$id, name: session.name, email: session.email, role: 'user' };
  }

  async login(email: string, password: string): Promise<User> {
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    const role = (user.prefs?.role as 'user' | 'admin') || 'user';
    return { $id: user.$id, name: user.name, email: user.email, role, phone: user.prefs?.phone, address: user.prefs?.address };
  }

  async logout(): Promise<void> {
    await account.deleteSession('current');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await account.get();
      const role = (user.prefs?.role as 'user' | 'admin') || 'user';
      return { $id: user.$id, name: user.name, email: user.email, role, phone: user.prefs?.phone, address: user.prefs?.address };
    } catch {
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    if (data.name) await account.updateName(data.name);
    const prefs: Record<string, any> = {};
    if (data.phone !== undefined) prefs.phone = data.phone;
    if (data.address !== undefined) prefs.address = data.address;
    if (Object.keys(prefs).length > 0) await account.updatePrefs(prefs);
    return (await this.getCurrentUser())!;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await account.updatePassword(newPassword, oldPassword);
  }

  async getBooks(search?: string, category?: string): Promise<Book[]> {
    let filtered = [...MOCK_BOOKS];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(b => b.category === category);
    }
    return filtered;
  }

  async getBook(bookId: string): Promise<Book | null> {
    return MOCK_BOOKS.find(b => b.$id === bookId) || null;
  }

  async getFeaturedBooks(): Promise<Book[]> {
    return MOCK_BOOKS.filter(b => b.isFeatured);
  }

  async getBestsellers(): Promise<Book[]> {
    return MOCK_BOOKS.filter(b => b.isBestseller);
  }

  async createBook(book: Omit<Book, '$id'>): Promise<Book> {
    const newBook: Book = { $id: ID.unique(), ...book };
    MOCK_BOOKS.push(newBook);
    return newBook;
  }

  async updateBook(bookId: string, updates: Partial<Book>): Promise<Book> {
    const idx = MOCK_BOOKS.findIndex(b => b.$id === bookId);
    if (idx === -1) throw new Error('Book not found');
    MOCK_BOOKS[idx] = { ...MOCK_BOOKS[idx], ...updates };
    return MOCK_BOOKS[idx];
  }

  async deleteBook(bookId: string): Promise<void> {
    const idx = MOCK_BOOKS.findIndex(b => b.$id === bookId);
    if (idx !== -1) MOCK_BOOKS.splice(idx, 1);
  }

  async createOrder(items: OrderItem[], shippingAddress: string): Promise<Order> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let storedAddress = shippingAddress;
    if (this.encryptionEnabled) {
      try {
        const key = await getSessionKey();
        storedAddress = await encrypt(shippingAddress, key);
      } catch {
        storedAddress = shippingAddress;
      }
    }

    const order: Order = {
      $id: ID.unique(),
      userId: user.$id,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      shippingAddress: shippingAddress, // store plain for display in mock
      trackingNumber: `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const saved = JSON.parse(sessionStorage.getItem('mock_orders') || '[]');
    saved.unshift(order);
    sessionStorage.setItem('mock_orders', JSON.stringify(saved));

    return order;
  }

  async getUserOrders(_userId: string): Promise<Order[]> {
    const saved = JSON.parse(sessionStorage.getItem('mock_orders') || '[]');
    if (saved.length > 0) return saved;

    return [
      {
        $id: 'order1', userId: 'demo',
        items: [
          { bookId: '1', bookTitle: 'The Great Gatsby', bookAuthor: 'F. Scott Fitzgerald', quantity: 1, price: 15.99, imageUrl: MOCK_BOOKS[0].imageUrl },
          { bookId: '3', bookTitle: '1984', bookAuthor: 'George Orwell', quantity: 1, price: 16.99, imageUrl: MOCK_BOOKS[2].imageUrl },
        ],
        totalAmount: 36.16, status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '123 Main St, New York, NY 10001',
        trackingNumber: 'TRK4A8F2B9C',
        estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        $id: 'order2', userId: 'demo',
        items: [{ bookId: '5', bookTitle: 'Clean Code', bookAuthor: 'Robert C. Martin', quantity: 1, price: 42.99, imageUrl: MOCK_BOOKS[4].imageUrl }],
        totalAmount: 46.39, status: 'shipped',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '456 Oak Ave, Chicago, IL 60601',
        trackingNumber: 'TRK9D3E7F1A',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getAllUsers(): Promise<User[]> {
    return [
      { $id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', phone: '555-0101', address: '100 Elm St' },
      { $id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', phone: '555-0102', address: '200 Oak Ave' },
      { $id: '3', name: 'Carol Davis', email: 'carol@example.com', role: 'user', phone: '555-0103' },
      { $id: '4', name: 'Admin User', email: 'admin@example.com', role: 'admin', phone: '555-0104' },
      { $id: '5', name: 'David Lee', email: 'david@example.com', role: 'user' },
    ];
  }

  async getAllOrders(): Promise<Order[]> {
    return [
      {
        $id: 'order1', userId: 'user1',
        items: [{ bookId: '1', bookTitle: 'The Great Gatsby', quantity: 2, price: 15.99, imageUrl: MOCK_BOOKS[0].imageUrl }],
        totalAmount: 34.54, status: 'completed',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '123 Main St', trackingNumber: 'TRK111',
      },
      {
        $id: 'order2', userId: 'user2',
        items: [
          { bookId: '3', bookTitle: '1984', quantity: 1, price: 16.99 },
          { bookId: '4', bookTitle: 'The Hobbit', quantity: 1, price: 14.99 },
        ],
        totalAmount: 34.53, status: 'processing',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '456 Oak Ave', trackingNumber: 'TRK222',
      },
      {
        $id: 'order3', userId: 'user3',
        items: [{ bookId: '10', bookTitle: 'Atomic Habits', quantity: 1, price: 27.99 }],
        totalAmount: 30.23, status: 'shipped',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '789 Pine Rd', trackingNumber: 'TRK333',
      },
      {
        $id: 'order4', userId: 'user4',
        items: [{ bookId: '5', bookTitle: 'Clean Code', quantity: 2, price: 42.99 }],
        totalAmount: 92.85, status: 'pending',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        shippingAddress: '321 Maple Dr', trackingNumber: 'TRK444',
      },
    ];
  }

  async getSalesReport(): Promise<SalesReport> {
    return {
      totalSales: 28458.50,
      totalOrders: 356,
      averageOrderValue: 79.94,
      topSellingBooks: [
        { bookId: '12', title: "Harry Potter and the Sorcerer's Stone", totalSold: 89, revenue: 2045.11 },
        { bookId: '10', title: 'Atomic Habits', totalSold: 72, revenue: 2015.28 },
        { bookId: '5', title: 'Clean Code', totalSold: 58, revenue: 2493.42 },
        { bookId: '6', title: 'Dune', totalSold: 54, revenue: 1079.46 },
        { bookId: '11', title: 'Sapiens', totalSold: 48, revenue: 1199.52 },
      ],
      salesByMonth: [
        { month: 'Jan', sales: 4120.50, orders: 48 },
        { month: 'Feb', sales: 5340.75, orders: 62 },
        { month: 'Mar', sales: 4890.25, orders: 57 },
        { month: 'Apr', sales: 6245.00, orders: 74 },
        { month: 'May', sales: 7862.00, orders: 91 },
        { month: 'Jun', sales: 0, orders: 0 },
      ],
    };
  }
}

export const api = new APIService();
