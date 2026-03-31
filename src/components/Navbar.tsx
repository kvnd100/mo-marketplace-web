import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth-context';
import { useCart } from '../store/cart-context';
import Icon from './Icon';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 z-50 w-full bg-white/70 shadow-sm backdrop-blur-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/products"
            className="text-2xl font-black tracking-tighter text-red-600"
          >
            MO Marketplace
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              to="/products"
              className="font-body text-sm text-zinc-600 transition-colors hover:text-red-600"
            >
              Products
            </Link>
            {isAuthenticated && (
              <Link
                to="/products/new"
                className="font-body text-sm text-zinc-600 transition-colors hover:text-red-600"
              >
                New Product
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden items-center rounded-full bg-zinc-100 px-4 py-2 lg:flex lg:w-64">
            <Icon name="search" className="text-sm text-zinc-400" />
            <input
              className="w-full border-none bg-transparent text-sm focus:ring-0 focus:outline-none"
              placeholder="Search..."
              type="text"
              aria-label="Search products"
            />
          </div>

          {/* Icon buttons */}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              className="rounded-full p-2 transition-colors duration-200 hover:bg-zinc-100 active:scale-95"
              aria-label="Favorites"
            >
              <Icon name="favorite" />
            </button>
            {isAuthenticated ? (
              <>
                <button
                  className="rounded-full p-2 transition-colors duration-200 hover:bg-zinc-100 active:scale-95"
                  aria-label="Profile"
                  title={user?.email ?? 'Profile'}
                >
                  <Icon name="person" />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full p-2 transition-colors duration-200 hover:bg-zinc-100 active:scale-95"
                  aria-label="Logout"
                  title="Logout"
                >
                  <Icon name="logout" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full p-2 transition-colors duration-200 hover:bg-zinc-100 active:scale-95"
                aria-label="Sign in"
              >
                <Icon name="person" />
              </Link>
            )}
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative rounded-full p-2 transition-colors duration-200 hover:bg-zinc-100 active:scale-95"
            aria-label={`Cart with ${totalItems} items`}
          >
            <Icon name="shopping_cart" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center justify-center rounded-full p-2 text-zinc-700 transition-colors hover:bg-zinc-100 sm:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-zinc-200 sm:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 font-body text-base text-zinc-700 transition hover:bg-zinc-100"
            >
              Products
            </Link>
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 font-body text-base text-zinc-700 transition hover:bg-zinc-100"
            >
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            {isAuthenticated && (
              <Link
                to="/products/new"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 font-body text-base text-zinc-700 transition hover:bg-zinc-100"
              >
                New Product
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <span className="block truncate px-3 py-2 font-label text-xs text-zinc-400">
                  {user?.email}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left font-body text-base text-zinc-700 transition hover:bg-zinc-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 font-body text-base font-semibold text-red-600 transition hover:bg-zinc-100"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
