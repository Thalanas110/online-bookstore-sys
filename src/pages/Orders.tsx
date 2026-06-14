import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api, Order } from '../lib/api';
import { Layout } from '../app/components/Layout';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Badge } from '../app/components/ui/badge';
import { Separator } from '../app/components/ui/separator';
import { Package, Clock, CheckCircle, XCircle, Truck, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<Order['status'], { icon: React.ReactNode; color: string; label: string; step: number }> = {
  pending: { icon: <Clock className="size-4" />, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending', step: 0 },
  processing: { icon: <Package className="size-4" />, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Processing', step: 1 },
  shipped: { icon: <Truck className="size-4" />, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Shipped', step: 2 },
  completed: { icon: <CheckCircle className="size-4" />, color: 'bg-green-100 text-green-800 border-green-200', label: 'Delivered', step: 3 },
  cancelled: { icon: <XCircle className="size-4" />, color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled', step: -1 },
};

const TRACKING_STEPS = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

function OrderTracking({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') return null;
  const step = STATUS_CONFIG[status].step;
  return (
    <div className="relative flex items-center justify-between mt-3">
      {/* Line */}
      <div className="absolute left-0 right-0 top-3 h-0.5 bg-muted" />
      <div
        className="absolute left-0 top-3 h-0.5 bg-primary transition-all"
        style={{ width: `${(step / (TRACKING_STEPS.length - 1)) * 100}%` }}
      />
      {TRACKING_STEPS.map((label, i) => (
        <div key={label} className="relative flex flex-col items-center gap-1">
          <div className={`size-6 rounded-full border-2 flex items-center justify-center z-10
            ${i <= step ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted-foreground/30'}
          `}>
            {i <= step && <div className="size-2 rounded-full bg-primary-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground text-center hidden sm:block" style={{ maxWidth: 64 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[order.status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base mb-1">
              Order #{order.$id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </p>
            {order.trackingNumber && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Tracking: {order.trackingNumber}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={`${config.color} border flex items-center gap-1.5`} variant="outline">
              {config.icon}
              {config.label}
            </Badge>
            <span className="text-lg">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Tracking Bar */}
        <OrderTracking status={order.status} />
      </CardHeader>

      <CardContent className="pt-2">
        {/* Item Previews */}
        <div className="flex gap-2 mb-3">
          {order.items.slice(0, 4).map((item, i) => (
            <div key={i} className="size-12 rounded overflow-hidden bg-muted flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.bookTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
              )}
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="size-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
              +{order.items.length - 4}
            </div>
          )}
          <div className="flex-1 flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="size-4 mr-1" /> : <ChevronDown className="size-4 mr-1" />}
              {expanded ? 'Hide' : 'Details'}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <>
            <Separator className="mb-3" />
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.bookTitle} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-3" />
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping address</span>
                <span className="text-right max-w-xs truncate">{order.shippingAddress}</span>
              </div>
              {order.estimatedDelivery && order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. delivery</span>
                  <span>{format(new Date(order.estimatedDelivery), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getUserOrders(user.$id)
      .then(data => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user?.$id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl mb-1">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}><CardContent className="h-40 animate-pulse bg-muted/50" /></Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <ShoppingBag className="size-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link to="/books"><Button>Start Shopping</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total', value: stats.total },
                { label: 'Active', value: stats.pending },
                { label: 'Shipped', value: stats.shipped },
                { label: 'Delivered', value: stats.completed },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              {orders.map(order => <OrderCard key={order.$id} order={order} />)}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
