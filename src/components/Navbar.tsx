import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth-context';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white shadow" role="navigation" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/products"
              className="text-xl font-bold tracking-tight text-red-600 transition hover:text-red-700"
            >
              MO Marketplace
            </Link>
            <div className="hidden sm:flex sm:gap-1">
              <Link
                to="/products"
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive('/products')
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Products
              </Link>
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-500 truncate max-w-[200px]">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 sm:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-200 sm:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium transition ${
                isActive('/products')
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Products
            </Link>
            {isAuthenticated ? (
              <>
                <span className="block px-3 py-2 text-sm text-gray-500 truncate">
                  {user?.email}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-red-600 transition hover:bg-gray-100"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
