import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api, Book } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { Layout } from '../app/components/Layout';
import { Input } from '../app/components/ui/input';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardFooter } from '../app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select';
import { Badge } from '../app/components/ui/badge';
import { Skeleton } from '../app/components/ui/skeleton';
import { Search, ShoppingCart, Star, Check, TrendingUp, Sparkles, Tag } from 'lucide-react';
import { toast } from 'sonner';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`size-3 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(book.$id);
  const discountedPrice = book.discount ? book.price * (1 - book.discount / 100) : book.price;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      bookId: book.$id,
      title: book.title,
      author: book.author,
      price: discountedPrice,
      imageUrl: book.imageUrl,
      stock: book.stock,
    });
    toast.success(`"${book.title}" added to cart`);
  }

  return (
    <Link to={`/books/${book.$id}`} className="group">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Cover */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          {book.imageUrl ? (
            <img
              src={book.imageUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
              <span className="text-5xl">📚</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {book.isBestseller && (
              <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" /> Bestseller
              </Badge>
            )}
            {book.isNew && (
              <Badge className="bg-emerald-500 text-white text-xs px-1.5 py-0.5 flex items-center gap-1">
                <Sparkles className="size-3" /> New
              </Badge>
            )}
            {book.discount && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 flex items-center gap-1">
                <Tag className="size-3" /> -{book.discount}%
              </Badge>
            )}
          </div>
          {book.stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-3">
          <Badge variant="outline" className="text-xs mb-2">{book.category}</Badge>
          <h3 className="line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
          <StarRating rating={book.rating} />
          <p className="text-xs text-muted-foreground mt-1">({book.reviewCount.toLocaleString()} reviews)</p>
        </CardContent>

        <CardFooter className="p-3 pt-0 flex items-center justify-between gap-2">
          <div>
            {book.discount ? (
              <div>
                <span className="text-muted-foreground line-through text-xs mr-1">${book.price.toFixed(2)}</span>
                <span className="text-red-600">${discountedPrice.toFixed(2)}</span>
              </div>
            ) : (
              <span>${book.price.toFixed(2)}</span>
            )}
          </div>
          <Button
            size="sm"
            variant={inCart ? 'secondary' : 'default'}
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className="shrink-0"
          >
            {inCart ? (
              <><Check className="size-3 mr-1" /> Added</>
            ) : (
              <><ShoppingCart className="size-3 mr-1" /> Add</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

function BookCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
];

async function fetchBooks(
  setBooks: (b: Book[]) => void,
  setLoading: (v: boolean) => void,
) {
  try {
    const data = await api.getBooks();
    setBooks(data);
  } catch {
    toast.error('Failed to load books');
  } finally {
    setLoading(false);
  }
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    fetchBooks(setBooks, setLoading);
  }, []);

  const categories = ['all', ...Array.from(new Set(books.map(b => b.category))).sort()];

  const filtered = books
    .filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !search || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchCat = category === 'all' || b.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'price_asc': return (a.discount ? a.price * (1 - a.discount / 100) : a.price) - (b.discount ? b.price * (1 - b.discount / 100) : b.price);
        case 'price_desc': return (b.discount ? b.price * (1 - b.discount / 100) : b.price) - (a.discount ? a.price * (1 - a.discount / 100) : a.price);
        case 'rating': return b.rating - a.rating;
        case 'newest': return b.publishedYear - a.publishedYear;
        default: return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
    });

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl">
            <h1 className="text-4xl mb-3">Discover Your Next Great Read</h1>
            <p className="text-muted-foreground mb-6">
              Browse our curated collection of {books.length}+ books across every genre. Free shipping on orders over $50.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or genre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? 'All Books' : cat}
              </Button>
            ))}
          </div>
          <div className="ml-auto">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'} found
            {search && ` for "${search}"`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-muted-foreground mb-4">No books found for your search</p>
            <Button variant="outline" onClick={() => { setSearch(''); setCategory('all'); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(book => <BookCard key={book.$id} book={book} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
