import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { api, Book } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { Layout } from '../app/components/Layout';
import { Button } from '../app/components/ui/button';
import { Badge } from '../app/components/ui/badge';
import { Separator } from '../app/components/ui/separator';
import { Skeleton } from '../app/components/ui/skeleton';
import { ArrowLeft, ShoppingCart, Star, Check, TrendingUp, Sparkles, Tag, Package, Shield, Truck } from 'lucide-react';
import { toast } from 'sonner';

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'size-3' : 'size-4';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${cls} ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
}

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem, isInCart, getQuantity } = useCart();
  const navigate = useNavigate();
  const inCart = book ? isInCart(book.$id) : false;
  const cartQty = book ? getQuantity(book.$id) : 0;

  useEffect(() => {
    if (!bookId) return;
    api.getBook(bookId)
      .then(data => setBook(data))
      .catch(() => toast.error('Failed to load book'))
      .finally(() => setLoading(false));
  }, [bookId]);

  function handleAddToCart() {
    if (!book) return;
    const discountedPrice = book.discount ? book.price * (1 - book.discount / 100) : book.price;
    for (let i = 0; i < quantity; i++) {
      addItem({
        bookId: book.$id,
        title: book.title,
        author: book.author,
        price: discountedPrice,
        imageUrl: book.imageUrl,
        stock: book.stock,
      });
    }
    toast.success(`${quantity} × "${book.title}" added to cart`);
  }

  function handleBuyNow() {
    handleAddToCart();
    navigate('/cart');
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-5xl">📭</div>
          <p className="text-muted-foreground">Book not found</p>
          <Link to="/books"><Button>Back to Books</Button></Link>
        </div>
      </Layout>
    );
  }

  const discountedPrice = book.discount ? book.price * (1 - book.discount / 100) : book.price;
  const totalPrice = discountedPrice * quantity;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Cover Image */}
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-muted shadow-lg">
              {book.imageUrl ? (
                <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                  <span className="text-9xl">📚</span>
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {book.isBestseller && (
                  <Badge className="bg-amber-500 text-white flex items-center gap-1">
                    <TrendingUp className="size-3" /> Bestseller
                  </Badge>
                )}
                {book.isNew && (
                  <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                    <Sparkles className="size-3" /> New Arrival
                  </Badge>
                )}
                {book.discount && (
                  <Badge className="bg-red-500 text-white flex items-center gap-1">
                    <Tag className="size-3" /> {book.discount}% OFF
                  </Badge>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Truck className="size-5 text-primary" />
                <span>Free Shipping<br />over $50</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Package className="size-5 text-primary" />
                <span>Easy Returns<br />30 Days</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <Shield className="size-5 text-primary" />
                <span>Secure<br />Checkout</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <Badge variant="outline" className="mb-3">{book.category}</Badge>
              <h1 className="text-3xl mb-2 leading-tight">{book.title}</h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={book.rating} />
              <span className="text-lg">{book.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({book.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl text-primary">${discountedPrice.toFixed(2)}</span>
                {book.discount && (
                  <span className="text-muted-foreground line-through text-lg">${book.price.toFixed(2)}</span>
                )}
              </div>
              {book.discount && (
                <p className="text-sm text-emerald-600">
                  You save ${(book.price - discountedPrice).toFixed(2)} ({book.discount}% off)
                </p>
              )}
              <p className="text-sm mt-1">
                {book.stock > 5 ? (
                  <span className="text-emerald-600">{book.stock} in stock</span>
                ) : book.stock > 0 ? (
                  <span className="text-amber-600">Only {book.stock} left — order soon!</span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
              </p>
            </div>

            {/* Quantity */}
            {book.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm">Quantity:</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none h-9 px-3"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </Button>
                  <span className="w-10 text-center text-sm">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none h-9 px-3"
                    onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                    disabled={quantity >= book.stock}
                  >
                    +
                  </Button>
                </div>
                {quantity > 1 && (
                  <span className="text-sm text-muted-foreground">
                    Total: ${totalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            )}

            {/* Cart status */}
            {inCart && cartQty > 0 && (
              <p className="text-sm text-muted-foreground">
                <Check className="size-4 inline mr-1 text-emerald-500" />
                {cartQty} already in your cart
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={book.stock === 0}
                variant={inCart ? 'secondary' : 'default'}
              >
                <ShoppingCart className="size-4 mr-2" />
                {inCart ? 'Add More to Cart' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={book.stock === 0}
              >
                Buy Now
              </Button>
            </div>

            <Separator />

            {/* Book Info */}
            <div>
              <h3 className="mb-3">About this book</h3>
              <p className="text-muted-foreground leading-relaxed">{book.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">ISBN</p>
                <p>{book.isbn}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Published</p>
                <p>{book.publishedYear}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <p>{book.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Availability</p>
                <p>{book.stock > 0 ? `${book.stock} units` : 'Out of stock'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
