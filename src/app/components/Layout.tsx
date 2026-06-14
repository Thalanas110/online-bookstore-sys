import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BookOpen, ShoppingCart, User, LogOut, Package, Shield, Menu, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  const navLinks = [
    { to: '/books', label: 'Browse Books' },
    { to: '/orders', label: 'My Orders' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/books" className="flex items-center gap-2 shrink-0">
              <div className="p-1.5 bg-primary rounded-lg">
                <BookOpen className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg hidden sm:block">PageTurn</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}>
                  <Button
                    variant={location.pathname === link.to ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button
                    variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    <Shield className="size-4 mr-1.5" />
                    Admin
                  </Button>
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="size-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs">
                      {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-9 px-3"
                  onClick={() => setUserMenuOpen(prev => !prev)}
                >
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-xs text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-sm">
                    {user?.name ?? 'Account'}
                  </span>
                  <ChevronDown className={`size-3.5 text-muted-foreground shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover shadow-lg z-[100]">
                    {/* User info */}
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                      >
                        <User className="size-4" /> Profile
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        onClick={() => { setUserMenuOpen(false); navigate('/orders'); }}
                      >
                        <Package className="size-4" /> My Orders
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          onClick={() => { setUserMenuOpen(false); navigate('/admin'); }}
                        >
                          <Shield className="size-4" /> Admin Dashboard
                        </button>
                      )}
                    </div>
                    <div className="border-t py-1">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-destructive"
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      >
                        <LogOut className="size-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-3 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    {link.label}
                  </Button>
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="size-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary rounded">
                <BookOpen className="size-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">PageTurn Bookstore © 2026</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>🔒 AES-256-GCM Encrypted</span>
              <span>Free shipping over $50</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
