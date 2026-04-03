import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import Cart from './pages/Cart';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/products/new" element={<ProductCreate />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
          </Route>
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
      <footer className="mt-auto w-full bg-zinc-200">
        <div className="grid grid-cols-2 gap-6 border-t border-zinc-300 px-4 py-12 md:grid-cols-4 md:px-8">
          <div className="col-span-2 md:col-span-1">
            <span className="mb-4 block font-headline text-xl font-black text-zinc-900">
              MO Marketplace
            </span>
            <p className="font-label text-xs uppercase leading-loose tracking-widest text-zinc-500">
              The Curated Gallery of Everyday
              <br />
              Essentials.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-label text-xs font-black uppercase tracking-widest text-zinc-900">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/products"
                  className="font-label text-xs uppercase tracking-widest text-zinc-500 transition-all hover:text-zinc-900"
                >
                  Products
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="font-label text-xs uppercase tracking-widest text-zinc-500 transition-all hover:text-zinc-900"
                >
                  Sign In
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="font-label text-xs uppercase tracking-widest text-zinc-500 transition-all hover:text-zinc-900"
                >
                  Register
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-label text-xs font-black uppercase tracking-widest text-zinc-900">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="font-label text-xs uppercase tracking-widest text-zinc-500">
                  Customer Service
                </span>
              </li>
              <li>
                <span className="font-label text-xs uppercase tracking-widest text-zinc-500">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="font-label text-xs uppercase tracking-widest text-zinc-500">
                  Press
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-label text-xs font-black uppercase tracking-widest text-zinc-900">
              Connect
            </h4>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-300 hover:text-zinc-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-300 hover:text-zinc-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-300 hover:text-zinc-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Pinterest" className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-300 hover:text-zinc-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-300 px-4 py-6 text-center">
          <p className="font-label text-[10px] uppercase tracking-widest text-zinc-500">
            &copy; 2026 MO Marketplace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
