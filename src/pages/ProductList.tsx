import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { Product, Category } from '../types';
import { useAuth } from '../store/auth-context';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';

const priceFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

export default function ProductList() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState<number>(0);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(Infinity);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    client
      .get<Product[]>('/products')
      .then((res) => setProducts(res.data))
      .catch(() => setError('Failed to load products. Please try again later.'))
      .finally(() => setLoading(false));
    client
      .get<Category[]>('/categories')
      .then((res) => setApiCategories(res.data))
      .catch(() => {});
  }, []);

  // Derive filter options from products
  const allCategories = useMemo(
    () =>
      apiCategories.length > 0
        ? apiCategories.map((c) => c.name).sort()
        : [...new Set(products.map((p) => p.category || 'Uncategorized'))].sort(),
    [apiCategories, products],
  );
  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand || 'Unbranded'))].sort(),
    [products],
  );
  const globalMaxPrice = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => Number(p.basePrice)), 0) / 10) * 10 || 1000,
    [products],
  );
  const globalMinPrice = useMemo(
    () => Math.floor(Math.min(...products.map((p) => Number(p.basePrice)), Infinity) / 10) * 10 || 0,
    [products],
  );

  // Initialize price range when products load
  useEffect(() => {
    if (products.length > 0 && priceMax === Infinity) {
      setPriceMax(globalMaxPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, globalMaxPrice]);

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const price = Number(product.basePrice);
      const effectiveMax = priceMax === Infinity ? globalMaxPrice : priceMax;
      if (price < priceMin || price > effectiveMax) return false;

      const allOut = product.variants.length > 0 && product.variants.every((v) => v.stock === 0);
      if (stockFilter === 'in-stock' && allOut) return false;
      if (stockFilter === 'out-of-stock' && !allOut) return false;

      if (selectedCategories.size > 0) {
        const cat = product.category || 'Uncategorized';
        if (!selectedCategories.has(cat)) return false;
      }

      if (selectedBrands.size > 0) {
        const brand = product.brand || 'Unbranded';
        if (!selectedBrands.has(brand)) return false;
      }

      if (selectedConditions.size > 0) {
        const cond = product.condition || 'new';
        if (!selectedConditions.has(cond)) return false;
      }

      if (minRating > 0) {
        const rating = product.rating ?? 0;
        if (rating < minRating) return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
        break;
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return result;
  }, [products, priceMin, priceMax, globalMaxPrice, selectedCategories, selectedBrands, selectedConditions, minRating, stockFilter, sortBy]);

  const toggleFilter = useCallback(
    (set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      setter(next);
    },
    [],
  );

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedConditions(new Set());
    setMinRating(0);
    setPriceMin(globalMinPrice);
    setPriceMax(globalMaxPrice);
    setStockFilter('all');
  };

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedBrands.size > 0 ||
    selectedConditions.size > 0 ||
    minRating > 0 ||
    stockFilter !== 'all' ||
    priceMin > globalMinPrice ||
    priceMax < globalMaxPrice;

  const activeFilterCount = [
    selectedCategories.size > 0,
    selectedBrands.size > 0,
    selectedConditions.size > 0,
    minRating > 0,
    stockFilter !== 'all',
    priceMin > globalMinPrice || priceMax < globalMaxPrice,
  ].filter(Boolean).length;

  /* ── Collapsible filter section ── */
  const FilterSection = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-zinc-100 pb-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between py-2"
        >
          <h4 className="font-headline text-xs font-bold text-zinc-900">{title}</h4>
          <Icon name={open ? 'expand_less' : 'expand_more'} className="text-base text-zinc-400" />
        </button>
        {open && <div className="pt-1">{children}</div>}
      </div>
    );
  };

  /* ── Star rating component for filter ── */
  const StarRating = ({ rating, onClick, interactive = false }: { rating: number; onClick?: () => void; interactive?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 ${interactive ? 'cursor-pointer transition hover:opacity-80' : ''}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          filled={i < rating}
          className={`text-sm ${i < rating ? 'text-amber-400' : 'text-zinc-200'}`}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-600">& Up</span>
    </button>
  );

  /* ── Filter sidebar content ── */
  const filterContent = (
    <div className="space-y-1">
      {/* Category */}
      {allCategories.length > 0 && (
        <FilterSection title="Category">
          <div className="space-y-1.5">
            {allCategories.map((cat) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={selectedCategories.has(cat)}
                  onChange={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{cat}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brand */}
      {allBrands.length > 0 && (
        <FilterSection title="Brand">
          <div className="space-y-1.5">
            {allBrands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand)}
                  onChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range Slider */}
      <FilterSection title="Price">
        <div className="px-1 pt-2">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-600">
            <span>{priceFmt(priceMin)}</span>
            <span>{priceFmt(priceMax === Infinity ? globalMaxPrice : priceMax)}</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Min</label>
              <input
                type="range"
                min={globalMinPrice}
                max={globalMaxPrice}
                step={1}
                value={priceMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPriceMin(Math.min(val, (priceMax === Infinity ? globalMaxPrice : priceMax) - 1));
                }}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Max</label>
              <input
                type="range"
                min={globalMinPrice}
                max={globalMaxPrice}
                step={1}
                value={priceMax === Infinity ? globalMaxPrice : priceMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPriceMax(Math.max(val, priceMin + 1));
                }}
                className="w-full accent-primary"
              />
            </div>
          </div>
          {/* Quick price presets */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { label: 'Under $25', min: 0, max: 25 },
              { label: '$25-$50', min: 25, max: 50 },
              { label: '$50-$100', min: 50, max: 100 },
              { label: '$100+', min: 100, max: globalMaxPrice },
            ].map(({ label, min, max }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setPriceMin(min); setPriceMax(max); }}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                  priceMin === min && priceMax === max
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Customer Rating */}
      <FilterSection title="Customer Rating">
        <div className="space-y-1 px-1">
          {[4, 3, 2, 1].map((stars) => (
            <div
              key={stars}
              className={`rounded px-1 py-1 transition ${minRating === stars ? 'bg-primary/5' : 'hover:bg-zinc-50'}`}
            >
              <StarRating
                rating={stars}
                interactive
                onClick={() => setMinRating(minRating === stars ? 0 : stars)}
              />
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condition">
        <div className="space-y-1.5">
          {[
            { value: 'new', label: 'New' },
            { value: 'used', label: 'Used' },
            { value: 'refurbished', label: 'Refurbished' },
          ].map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={selectedConditions.has(value)}
                onChange={() => toggleFilter(selectedConditions, setSelectedConditions, value)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <div className="space-y-1.5">
          {([
            { val: 'all', label: 'All' },
            { val: 'in-stock', label: 'In Stock' },
            { val: 'out-of-stock', label: 'Out of Stock' },
          ] as const).map(({ val, label }) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition hover:bg-zinc-50">
              <input
                type="radio"
                name="stock"
                checked={stockFilter === val}
                onChange={() => setStockFilter(val)}
                className="h-3.5 w-3.5 border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="mt-3 w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
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
          <aside className="hidden w-60 shrink-0 border-r border-zinc-200 p-4 lg:block">
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
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
          <div className="flex-1 p-4">
            <div className="mb-6 flex items-end justify-between">
              <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex min-h-[28rem] animate-pulse flex-col overflow-hidden rounded-[1.35rem] border border-zinc-100 bg-white"
                >
                  <div className="p-3 pb-0">
                    <div className="aspect-square rounded-2xl bg-zinc-200" />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
                    <div className="h-4 w-3/4 rounded bg-zinc-200" />
                    <div className="mt-2 h-8 w-full rounded bg-zinc-100" />
                    <div className="mt-auto flex justify-between pt-3">
                      <div className="h-6 w-20 rounded bg-zinc-200" />
                      <div className="h-8 w-20 rounded-lg bg-zinc-200" />
                    </div>
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
            className="mt-4 rounded-lg bg-primary px-6 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-on-primary transition hover:bg-primary-container active:scale-95"
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
              className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-body text-xs font-semibold uppercase tracking-widest text-on-primary transition-all hover:bg-primary-container active:scale-95"
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
      {/* Mobile filter bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700"
        >
          <Icon name="tune" className="text-base" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 focus:border-primary focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="rating">Avg. Rating</option>
          </select>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="border-b border-zinc-200 bg-white p-4 lg:hidden">
          {filterContent}
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-60 shrink-0 overflow-y-auto border-r border-zinc-100 bg-white p-4 lg:block"
          style={{ height: 'calc(100vh - 4rem)', position: 'sticky', top: '4rem' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold text-on-surface">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-semibold text-primary transition hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          {filterContent}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Results header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">
                  Results
                </h1>
                <span className="text-sm text-zinc-500">
                  {filteredProducts.length} of {products.length}
                </span>
              </div>
              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...selectedCategories].map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {cat}
                      <button onClick={() => toggleFilter(selectedCategories, setSelectedCategories, cat)} className="hover:text-primary/70">
                        <Icon name="close" className="text-xs" />
                      </button>
                    </span>
                  ))}
                  {[...selectedBrands].map((brand) => (
                    <span key={brand} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {brand}
                      <button onClick={() => toggleFilter(selectedBrands, setSelectedBrands, brand)} className="hover:text-primary/70">
                        <Icon name="close" className="text-xs" />
                      </button>
                    </span>
                  ))}
                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {minRating}+ stars
                      <button onClick={() => setMinRating(0)} className="hover:text-primary/70">
                        <Icon name="close" className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:border-primary focus:outline-none"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Avg. Customer Rating</option>
              </select>
              {isAuthenticated && (
                <Link
                  to="/products/new"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-95"
                >
                  Add Product
                </Link>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="search_off" className="mx-auto text-5xl text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-500">
                No products match your filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-3 text-xs font-semibold text-primary transition hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
