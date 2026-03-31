import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { Product } from '../types';
import { useAuth } from '../store/auth-context';
import { useCart } from '../store/cart-context';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';
import QuickAdd from '../components/QuickAdd';

export default function ProductList() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    client
      .get<Product[]>('/products')
      .then((res) => setProducts(res.data))
      .catch(() => setError('Failed to load products. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const allColors = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants.map((v) => v.color)))].sort(),
    [products],
  );
  const allSizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))].sort(),
    [products],
  );
  const allMaterials = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants.map((v) => v.material)))].sort(),
    [products],
  );
  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => Number(p.basePrice)), 0),
    [products],
  );

  // Apply filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const price = Number(product.basePrice);
      if (price < priceRange[0] || price > priceRange[1]) return false;

      const allOut =
        product.variants.length > 0 && product.variants.every((v) => v.stock === 0);
      if (stockFilter === 'in-stock' && allOut) return false;
      if (stockFilter === 'out-of-stock' && !allOut) return false;

      if (selectedColors.size > 0) {
        const productColors = new Set(product.variants.map((v) => v.color));
        if (![...selectedColors].some((c) => productColors.has(c))) return false;
      }

      if (selectedSizes.size > 0) {
        const productSizes = new Set(product.variants.map((v) => v.size));
        if (![...selectedSizes].some((s) => productSizes.has(s))) return false;
      }

      if (selectedMaterials.size > 0) {
        const productMaterials = new Set(product.variants.map((v) => v.material));
        if (![...selectedMaterials].some((m) => productMaterials.has(m))) return false;
      }

      return true;
    });
  }, [products, priceRange, selectedColors, selectedSizes, selectedMaterials, stockFilter]);

  const toggleFilter = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const clearAllFilters = () => {
    setPriceRange([0, Infinity]);
    setSelectedColors(new Set());
    setSelectedSizes(new Set());
    setSelectedMaterials(new Set());
    setStockFilter('all');
  };

  const hasActiveFilters =
    selectedColors.size > 0 ||
    selectedSizes.size > 0 ||
    selectedMaterials.size > 0 ||
    stockFilter !== 'all' ||
    priceRange[0] > 0 ||
    priceRange[1] < Infinity;

  /* ── Filter sidebar content ── */
  const filterContent = (
    <div className="space-y-6">
      {/* Stock filter */}
      <div>
        <h4 className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-900">
          Availability
        </h4>
        <div className="space-y-2">
          {(['all', 'in-stock', 'out-of-stock'] as const).map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="stock"
                checked={stockFilter === val}
                onChange={() => setStockFilter(val)}
                className="h-3.5 w-3.5 border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-zinc-700 capitalize">
                {val === 'all' ? 'All' : val === 'in-stock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price filter */}
      {maxPrice > 0 && (
        <div>
          <h4 className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-900">
            Price
          </h4>
          <div className="space-y-2">
            {[
              { label: 'All Prices', min: 0, max: Infinity },
              { label: 'Under $25', min: 0, max: 25 },
              { label: '$25 - $50', min: 25, max: 50 },
              { label: '$50 - $100', min: 50, max: 100 },
              { label: '$100 - $500', min: 100, max: 500 },
              { label: 'Over $500', min: 500, max: Infinity },
            ].map(({ label, min, max }) => (
              <label key={label} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange[0] === min && priceRange[1] === max}
                  onChange={() => setPriceRange([min, max])}
                  className="h-3.5 w-3.5 border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Color filter */}
      {allColors.length > 0 && (
        <div>
          <h4 className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-900">
            Color
          </h4>
          <div className="space-y-2">
            {allColors.map((color) => (
              <label key={color} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedColors.has(color)}
                  onChange={() => toggleFilter(selectedColors, setSelectedColors, color)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{color}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Size filter */}
      {allSizes.length > 0 && (
        <div>
          <h4 className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-900">
            Size
          </h4>
          <div className="space-y-2">
            {allSizes.map((size) => (
              <label key={size} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedSizes.has(size)}
                  onChange={() => toggleFilter(selectedSizes, setSelectedSizes, size)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{size}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Material filter */}
      {allMaterials.length > 0 && (
        <div>
          <h4 className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-zinc-900">
            Material
          </h4>
          <div className="space-y-2">
            {allMaterials.map((material) => (
              <label key={material} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMaterials.has(material)}
                  onChange={() => toggleFilter(selectedMaterials, setSelectedMaterials, material)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{material}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full rounded-lg border border-zinc-200 py-2 font-label text-xs font-bold uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-50"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  /* ── Loading ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="pt-16">
        <div className="flex">
          {/* Skeleton sidebar */}
          <aside className="hidden w-56 shrink-0 border-r border-zinc-200 p-4 lg:block">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-3 h-3 w-20 animate-pulse rounded bg-zinc-200" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <div key={j} className="h-4 w-full animate-pulse rounded bg-zinc-100" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
          {/* Skeleton grid */}
          <div className="flex-1 p-4">
            <div className="mb-6 flex items-end justify-between">
              <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-zinc-100 bg-white">
                  <div className="aspect-square bg-zinc-200" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 rounded bg-zinc-200" />
                    <div className="h-4 w-1/3 rounded bg-zinc-200" />
                    <div className="h-3 w-1/2 rounded bg-zinc-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────── */
  if (error) {
    return (
      <div className="px-4 pt-20 pb-20">
        <div className="rounded-xl bg-error-container p-8 text-center">
          <Icon name="error" className="mx-auto text-4xl text-on-error-container" />
          <p className="mt-3 font-body text-on-error-container">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-6 py-2.5 font-label text-xs font-black uppercase tracking-widest text-on-primary transition hover:bg-primary-container active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────────── */
  if (products.length === 0) {
    return (
      <div className="px-4 pt-20 pb-20 text-center">
        <div className="py-20">
          <Icon name="inventory_2" className="mx-auto text-6xl text-zinc-300" />
          <h2 className="mt-6 font-headline text-3xl font-black tracking-tight text-on-surface">
            No products yet
          </h2>
          <p className="mt-2 font-body text-zinc-500">
            Get started by creating your first product.
          </p>
          {isAuthenticated && (
            <Link
              to="/products/new"
              className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-label text-xs font-black uppercase tracking-widest text-on-primary transition-all hover:bg-primary-container active:scale-95"
            >
              Create Your First Product
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── Product Grid with sidebar ─────────────────────── */
  return (
    <div className="pt-16">
      {/* Mobile filter toggle */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-1 font-label text-xs font-bold uppercase tracking-widest text-zinc-700"
        >
          <Icon name="filter_list" className="text-base" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
              !
            </span>
          )}
        </button>
        <span className="font-label text-xs text-zinc-500">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="border-b border-zinc-200 bg-white p-4 lg:hidden">
          {filterContent}
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-zinc-200 p-4 lg:block" style={{ height: 'calc(100vh - 4rem)', position: 'sticky', top: '4rem' }}>
          <h3 className="mb-4 font-headline text-sm font-bold text-on-surface">Filters</h3>
          {filterContent}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h1 className="font-headline text-xl font-black tracking-tight text-on-surface">
                Products
              </h1>
              <p className="mt-0.5 font-label text-xs text-zinc-500">
                {filteredProducts.length} of {products.length} result{products.length !== 1 ? 's' : ''}
              </p>
            </div>
            {isAuthenticated && (
              <Link
                to="/products/new"
                className="rounded-lg bg-primary px-4 py-2 font-label text-xs font-bold text-on-primary transition-all hover:bg-primary-container active:scale-95"
              >
                Add Product
              </Link>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="search_off" className="mx-auto text-5xl text-zinc-300" />
              <p className="mt-3 font-body text-sm text-zinc-500">
                No products match your filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-3 font-label text-xs font-bold uppercase tracking-widest text-primary transition hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const allOutOfStock =
                  product.variants.length > 0 &&
                  product.variants.every((v) => v.stock === 0);
                const inStockVariants = product.variants.filter((v) => v.stock > 0);

                const handleAddToCart = () => {
                  if (inStockVariants.length === 1) {
                    const v = inStockVariants[0];
                    addItem({
                      productId: product.id,
                      productName: product.name,
                      productImage: product.imageUrl,
                      variantId: v.id,
                      combinationKey: v.combinationKey,
                      color: v.color,
                      size: v.size,
                      material: v.material,
                      price: Number(v.price),
                      stock: v.stock,
                    });
                  } else if (inStockVariants.length > 1) {
                    setQuickAddProduct(product);
                  }
                };

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="relative aspect-square bg-surface-container-low"
                    >
                      <ProductImage src={product.imageUrl} alt={product.name} />
                      {allOutOfStock && (
                        <span className="absolute top-1.5 left-1.5 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Out of Stock
                        </span>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-3">
                      <Link to={`/products/${product.id}`}>
                        <h2 className="line-clamp-2 text-sm font-normal text-on-surface transition-colors group-hover:text-primary">
                          {product.name}
                        </h2>
                      </Link>
                      <p className="mt-1 text-lg font-bold text-on-surface">
                        ${Number(product.basePrice).toFixed(2)}
                      </p>
                      {product.variants.length > 0 && (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {product.variants.length}{' '}
                          {product.variants.length === 1 ? 'variant' : 'variants'}
                        </p>
                      )}
                      <button
                        onClick={handleAddToCart}
                        disabled={inStockVariants.length === 0}
                        className="mt-auto pt-2 w-full rounded bg-primary py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:opacity-40"
                      >
                        {inStockVariants.length === 0
                          ? 'Out of Stock'
                          : inStockVariants.length === 1
                            ? 'Add to Cart'
                            : 'Select Options'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QuickAdd modal for multi-variant products */}
      {quickAddProduct && (
        <QuickAdd
          product={quickAddProduct}
          open={!!quickAddProduct}
          onClose={() => setQuickAddProduct(null)}
        />
      )}
    </div>
  );
}
