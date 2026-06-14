import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Books from '../pages/Books';
import BookDetail from '../pages/BookDetail';
import Profile from '../pages/Profile';
import Orders from '../pages/Orders';
import Admin from '../pages/Admin';
import Cart from '../pages/Cart';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Redirect to the right home based on role */
function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/books" replace />;
}

/** Only unauthenticated users. Admin goes to /admin, user goes to /books */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/books'} replace />;
  return <>{children}</>;
}

/** Only authenticated regular users. Admins are bounced to /admin */
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

/** Only authenticated admins */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/books" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <RoleHome /> },

  // Public (auth) routes
  { path: '/login', element: <PublicRoute><Login /></PublicRoute> },
  { path: '/register', element: <PublicRoute><Register /></PublicRoute> },

  // Customer-only routes (admins get redirected away)
  { path: '/books', element: <CustomerRoute><Books /></CustomerRoute> },
  { path: '/books/:bookId', element: <CustomerRoute><BookDetail /></CustomerRoute> },
  { path: '/cart', element: <CustomerRoute><Cart /></CustomerRoute> },
  { path: '/orders', element: <CustomerRoute><Orders /></CustomerRoute> },
  { path: '/profile', element: <CustomerRoute><Profile /></CustomerRoute> },

  // Admin-only routes
  { path: '/admin', element: <AdminRoute><Admin /></AdminRoute> },

  { path: '*', element: <RoleHome /> },
]);
