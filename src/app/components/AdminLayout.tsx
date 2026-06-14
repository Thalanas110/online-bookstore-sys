import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './ui/button';
import { Shield, LogOut, LayoutDashboard, Package, Users, BarChart3, BookOpen, ChevronDown, Menu, X, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

interface NavLink {
  tab: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: NavLink[] = [
  { tab: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'books',    label: 'Books',     icon: BookOpen },
  { tab: 'orders',   label: 'Orders',    icon: Package },
  { tab: 'users',    label: 'Users',     icon: Users },
  { tab: 'reports',  label: 'Reports',   icon: BarChart3 },
  { tab: 'docs',     label: 'API Docs',  icon: FileCode2 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTab = new URLSearchParams(location.search).get('tab') ?? 'overview';

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  function tabHref(tab: string) {
    return tab === 'overview' ? '/admin' : `/admin?tab=${tab}`;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <Link to="/admin" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Shield className="size-4 text-primary-foreground" />
              </div>
              <span className="hidden sm:block">PageTurn</span>
            </Link>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Admin</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ tab, label, icon: Icon }) => (
              <Link key={tab} to={tabHref(tab)}>
                <Button
                  variant={activeTab === tab ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-9 px-3"
              onClick={() => setUserMenuOpen(v => !v)}
            >
              <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-xs text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="hidden sm:block max-w-[120px] truncate text-sm">{user?.name}</span>
              <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-md border bg-popover shadow-lg z-[100]">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t py-2 px-2 space-y-1 bg-background">
            {NAV_LINKS.map(({ tab, label, icon: Icon }) => (
              <Link key={tab} to={tabHref(tab)} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={activeTab === tab ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-background">
        PageTurn Admin Panel · {user?.email}
      </footer>
    </div>
  );
}
