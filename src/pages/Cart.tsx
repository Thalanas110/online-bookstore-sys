import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { api, OrderItem } from '../lib/api';
import { Layout } from '../app/components/Layout';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Separator } from '../app/components/ui/separator';
import { Badge } from '../app/components/ui/badge';
import { ArrowLeft, Trash2, ShoppingBag, Plus, Minus, Shield, Truck, Tag } from 'lucide-react';
import { toast } from 'sonner';

const PROMO_CODES: Record<string, number> = {
  SAVE10: 10,
  BOOK20: 20,
  WELCOME15: 15,
};

export default function Cart() {
  const { user } = useAuth();
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const promoDiscount = appliedPromo ? (subtotal * appliedPromo.discount) / 100 : 0;
  const total = subtotal + shippingCost + tax - promoDiscount;

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, discount: PROMO_CODES[code] });
      toast.success(`Promo code applied — ${PROMO_CODES[code]}% off!`);
    } else {
      toast.error('Invalid promo code');
    }
  }

  async function handleCheckout() {
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    setLoading(true);
    try {
      const orderItems: OrderItem[] = items.map(item => ({
        bookId: item.bookId,
        bookTitle: item.title,
        bookAuthor: item.author,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        price: item.price,
      }));

      await api.createOrder(orderItems, shippingAddress);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <ShoppingBag className="size-20 mx-auto mb-6 text-muted-foreground/40" />
          <h2 className="text-2xl mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any books yet. Browse our collection to find your next great read.
          </p>
          <Link to="/books">
            <Button size="lg">Browse Books</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/books">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-2xl">Shopping Cart</h1>
          <Badge variant="secondary">{itemCount} {itemCount === 1 ? 'item' : 'items'}</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <Card key={item.bookId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Book thumbnail */}
                    <Link to={`/books/${item.bookId}`} className="shrink-0">
                      <div className="size-20 rounded-lg overflow-hidden bg-muted">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/books/${item.bookId}`}>
                        <h3 className="hover:text-primary transition-colors line-clamp-1 mb-0.5">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-2">{item.author}</p>
                      <p className="text-sm mb-3">${item.price.toFixed(2)} each</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 px-2 rounded-none"
                            onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 px-2 rounded-none"
                            onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { removeItem(item.bookId); toast.success('Item removed'); }}
                          className="text-destructive hover:text-destructive h-8"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear cart */}
            <div className="text-right">
              <Button variant="ghost" size="sm" onClick={() => { clearCart(); toast.info('Cart cleared'); }}>
                <Trash2 className="size-4 mr-1" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Promo Code */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="size-4" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appliedPromo ? (
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-emerald-600">
                      {appliedPromo.code} — {appliedPromo.discount}% off
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setAppliedPromo(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code (e.g. SAVE10)"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    />
                    <Button onClick={applyPromo} disabled={!promoCode.trim()}>Apply</Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Try: SAVE10, BOOK20, WELCOME15</p>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promo discount</span>
                      <span>−${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-emerald-600' : ''}>
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  {shippingCost > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <Truck className="size-3 inline mr-1" />
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Separator />

                {/* Shipping Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="addr">Shipping Address</Label>
                  <Input
                    id="addr"
                    placeholder="123 Main St, City, State 12345"
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="size-3" />
                    Encrypted with AES-256-GCM
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading || !shippingAddress.trim()}
                >
                  {loading ? 'Processing...' : `Place Order — $${total.toFixed(2)}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing your order you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
