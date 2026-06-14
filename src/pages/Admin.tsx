import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { api, Book, Order, User, SalesReport } from '../lib/api';
import { AdminLayout } from '../app/components/AdminLayout';
import { ApiDocs } from '../app/components/ApiDocs';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Badge } from '../app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, Package, Users, ShoppingBag, Plus, Pencil, Trash2,
  DollarSign, Star, Shield, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Technology', 'Business', 'Self-Help', 'Classic'];

function BookForm({
  book, onSave, onClose,
}: {
  book?: Partial<Book>;
  onSave: (b: Omit<Book, '$id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Book, '$id'>>({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    price: book?.price || 0,
    stock: book?.stock || 0,
    description: book?.description || '',
    category: book?.category || 'Fiction',
    imageUrl: book?.imageUrl || '',
    publishedYear: book?.publishedYear || new Date().getFullYear(),
    rating: book?.rating || 4.0,
    reviewCount: book?.reviewCount || 0,
    isFeatured: book?.isFeatured || false,
    isBestseller: book?.isBestseller || false,
    isNew: book?.isNew || false,
  });

  function update(field: keyof typeof form, val: any) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Title</Label>
          <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Book title" />
        </div>
        <div className="space-y-1">
          <Label>Author</Label>
          <Input value={form.author} onChange={e => update('author', e.target.value)} placeholder="Author name" />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => update('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Price ($)</Label>
          <Input type="number" step="0.01" min="0" value={form.price} onChange={e => update('price', parseFloat(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Stock</Label>
          <Input type="number" min="0" value={form.stock} onChange={e => update('stock', parseInt(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>ISBN</Label>
          <Input value={form.isbn} onChange={e => update('isbn', e.target.value)} placeholder="978-..." />
        </div>
        <div className="space-y-1">
          <Label>Published Year</Label>
          <Input type="number" value={form.publishedYear} onChange={e => update('publishedYear', parseInt(e.target.value))} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Cover Image URL</Label>
          <Input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Book description..."
          />
        </div>
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={e => update('isFeatured', e.target.checked)} className="rounded" />
            Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isBestseller} onChange={e => update('isBestseller', e.target.checked)} className="rounded" />
            Bestseller
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isNew} onChange={e => update('isNew', e.target.checked)} className="rounded" />
            New Arrival
          </label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title || !form.author || form.price <= 0}>
          {book?.title ? 'Update Book' : 'Add Book'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Admin() {
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') ?? 'overview';

  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  const [bookDialog, setBookDialog] = useState<{ open: boolean; book?: Book }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; bookId?: string; title?: string }>({ open: false });
  const [searchBook, setSearchBook] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [b, o, u, r] = await Promise.all([
        api.getBooks(), api.getAllOrders(), api.getAllUsers(), api.getSalesReport(),
      ]);
      setBooks(b);
      setOrders(o);
      setUsers(u);
      setReport(r);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBook(data: Omit<Book, '$id'>) {
    try {
      if (bookDialog.book) {
        const updated = await api.updateBook(bookDialog.book.$id, data);
        setBooks(prev => prev.map(b => b.$id === updated.$id ? updated : b));
        toast.success('Book updated');
      } else {
        const created = await api.createBook(data);
        setBooks(prev => [created, ...prev]);
        toast.success('Book added');
      }
      setBookDialog({ open: false });
    } catch {
      toast.error('Failed to save book');
    }
  }

  async function handleDeleteBook(bookId: string) {
    try {
      await api.deleteBook(bookId);
      setBooks(prev => prev.filter(b => b.$id !== bookId));
      toast.success('Book deleted');
    } catch {
      toast.error('Failed to delete book');
    } finally {
      setDeleteDialog({ open: false });
    }
  }

  const filteredBooks = books.filter(b =>
    !searchBook || b.title.toLowerCase().includes(searchBook.toLowerCase()) ||
    b.author.toLowerCase().includes(searchBook.toLowerCase())
  );

  const statusColor: Record<Order['status'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20 text-muted-foreground">Loading admin data...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your bookstore</p>
          </div>
        </div>

        {/* KPI Cards */}
        {report && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<DollarSign className="size-5" />} label="Total Revenue" value={`$${report.totalSales.toLocaleString()}`} sub="All time" />
            <StatCard icon={<ShoppingBag className="size-5" />} label="Total Orders" value={report.totalOrders.toString()} sub={`Avg $${report.averageOrderValue.toFixed(2)}`} />
            <StatCard icon={<Package className="size-5" />} label="Books in Catalog" value={books.length.toString()} sub="Active listings" />
            <StatCard icon={<Users className="size-5" />} label="Customers" value={users.length.toString()} sub="Registered users" />
          </div>
        )}

        <Tabs value={activeTab}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="docs">API Docs</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {report && (
              <>
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="size-4" />
                        Monthly Revenue (2026)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={report.salesByMonth}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Orders Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShoppingBag className="size-4" />
                        Monthly Orders (2026)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={report.salesByMonth}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [v, 'Orders']} />
                          <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Selling Books */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="size-4" />
                      Top Selling Books
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Book</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topSellingBooks.map((b, i) => (
                          <TableRow key={b.bookId}>
                            <TableCell>
                              <span className={`inline-flex size-6 rounded-full items-center justify-center text-xs
                                ${i === 0 ? 'bg-amber-100 text-amber-800' :
                                  i === 1 ? 'bg-slate-100 text-slate-800' :
                                  i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-muted text-muted-foreground'}`}>
                                {i + 1}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{b.title}</TableCell>
                            <TableCell className="text-right">{b.totalSold}</TableCell>
                            <TableCell className="text-right">${b.revenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Books Management */}
          <TabsContent value="books">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">Book Catalog ({books.length})</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search books..."
                      value={searchBook}
                      onChange={e => setSearchBook(e.target.value)}
                      className="w-48"
                    />
                    <Button size="sm" onClick={() => setBookDialog({ open: true })}>
                      <Plus className="size-4 mr-1" /> Add Book
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map(book => (
                        <TableRow key={book.$id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {book.imageUrl && (
                                <img src={book.imageUrl} alt={book.title} className="size-8 rounded object-cover" />
                              )}
                              <div>
                                <p className="max-w-[200px] truncate text-sm">{book.title}</p>
                                <p className="text-xs text-muted-foreground">{book.author}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{book.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">${book.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={book.stock <= 5 ? 'text-amber-600' : book.stock === 0 ? 'text-destructive' : ''}>
                              {book.stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{book.rating.toFixed(1)} ⭐</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setBookDialog({ open: true, book })}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteDialog({ open: true, bookId: book.$id, title: book.title })}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Orders ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.$id}>
                        <TableCell className="font-mono text-xs">
                          #{order.$id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{order.items.length} item(s)</TableCell>
                        <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor[order.status]} text-xs border-0`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {order.trackingNumber}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.$id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {u.role === 'admin' ? <><Shield className="size-3 mr-1" />Admin</> : 'User'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            {report && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    Sales Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard icon={<DollarSign className="size-5" />} label="Total Revenue" value={`$${report.totalSales.toLocaleString()}`} />
                    <StatCard icon={<ShoppingBag className="size-5" />} label="Total Orders" value={report.totalOrders.toString()} />
                    <StatCard icon={<Star className="size-5" />} label="Avg Order Value" value={`$${report.averageOrderValue.toFixed(2)}`} />
                  </div>
                  <div>
                    <p className="text-sm mb-3">Monthly Revenue</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={report.salesByMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-sm mb-3">Top Selling Books</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topSellingBooks.map((b, i) => (
                          <TableRow key={b.bookId}>
                            <TableCell className="flex items-center gap-2">
                              <span className="size-5 rounded-full bg-muted text-xs flex items-center justify-center">{i + 1}</span>
                              <span className="max-w-[200px] truncate">{b.title}</span>
                            </TableCell>
                            <TableCell className="text-right">{b.totalSold}</TableCell>
                            <TableCell className="text-right">${b.revenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* API Docs */}
          <TabsContent value="docs">
            <ApiDocs />
          </TabsContent>
        </Tabs>

        {/* Add/Edit Book Dialog */}
        <Dialog open={bookDialog.open} onOpenChange={open => !open && setBookDialog({ open: false })}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{bookDialog.book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            </DialogHeader>
            <BookForm
              book={bookDialog.book}
              onSave={handleSaveBook}
              onClose={() => setBookDialog({ open: false })}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Book
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>"{deleteDialog.title}"</strong>? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteDialog.bookId && handleDeleteBook(deleteDialog.bookId)}
              >
                Delete Book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
