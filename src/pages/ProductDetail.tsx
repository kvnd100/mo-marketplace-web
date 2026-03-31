import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import type { Product, Variant } from '../types';
import VariantSelector from '../components/VariantSelector';
import QuickBuy from '../components/QuickBuy';
import Icon from '../components/Icon';
import { useCart } from '../store/cart-context';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    client
      .get<Product>(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else if (err.response?.status === 401) {
          setError('You must be logged in to view this product.');
        } else {
          setError('Failed to load product. Please try again later.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading skeleton ─────────────────────────────────── */
  if (loading) {
    return (
      <div className="px-4 pt-20 pb-20">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-3 w-10 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-3 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-3 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="aspect-[4/3] animate-pulse rounded-lg bg-zinc-200" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-200" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="mt-6 space-y-5">
              <div className="h-16 animate-pulse rounded bg-zinc-200" />
              <div className="h-16 animate-pulse rounded bg-zinc-200" />
              <div className="h-16 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 404 ───────────────────────────────────────────────── */
  if (notFound) {
    return (
      <div className="px-4 pt-20 pb-20 text-center">
        <div className="py-20">
          <Icon name="sentiment_dissatisfied" className="mx-auto text-6xl text-zinc-300" />
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-tighter text-on-surface">
            404
          </h1>
          <p className="mt-3 font-body text-lg text-zinc-500">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-label text-xs font-black uppercase tracking-widest text-on-primary transition-all duration-200 hover:bg-primary-container active:scale-95"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────── */
  if (error || !product) {
    return (
      <div className="px-4 pt-20 pb-20">
        <div className="rounded-xl bg-error-container p-8 text-center">
          <Icon name="error" className="mx-auto text-4xl text-on-error-container" />
          <p className="mt-3 font-body text-on-error-container">
            {error ?? 'Something went wrong.'}
          </p>
          <Link
            to="/products"
            className="mt-4 inline-block font-label text-xs font-bold uppercase tracking-widest text-primary transition hover:underline"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant: Variant | undefined =
    selectedColor && selectedSize && selectedMaterial
      ? product.variants.find(
          (v) =>
            v.color === selectedColor &&
            v.size === selectedSize &&
            v.material === selectedMaterial,
        )
      : undefined;

  const allOutOfStock =
    product.variants.length > 0 && product.variants.every((v) => v.stock === 0);

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const displayPrice = selectedVariant
    ? Number(selectedVariant.price).toFixed(2)
    : Number(product.basePrice).toFixed(2);

  return (
    <main className="px-4 pt-20 pb-20">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 font-label text-xs uppercase tracking-widest text-on-surface-variant">
        <Link to="/products" className="transition-colors hover:text-primary">
          Home
        </Link>
        <Icon name="chevron_right" className="text-xs" />
        <Link to="/products" className="transition-colors hover:text-primary">
          Products
        </Link>
        <Icon name="chevron_right" className="text-xs" />
        <span className="font-bold text-on-surface">{product.name}</span>
      </nav>

      {/* Product Gallery & Selection */}
      <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Hero Image Gallery */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="editorial-shadow group relative cursor-zoom-in overflow-hidden rounded-lg bg-surface-container-low">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100">
                <Icon name="image" className="text-7xl text-zinc-300" />
              </div>
            )}
            {allOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-lg bg-primary px-6 py-3 font-headline text-lg font-bold text-white">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          <div className="grid grid-cols-4 gap-3">
            <div className="h-20 overflow-hidden rounded-lg border-2 border-primary bg-surface-container-highest">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={`${product.name} thumbnail`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-400">
                  <Icon name="image" />
                </div>
              )}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-surface-container-highest text-zinc-400"
              >
                <Icon name="image" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col lg:col-span-5">
          {/* Badge */}
          {product.variants.length > 0 && !allOutOfStock && (
            <div className="mb-2">
              <span className="rounded bg-tertiary-container/10 px-2 py-1 font-label text-[10px] font-black uppercase tracking-widest text-tertiary">
                {product.variants.length} Variant{product.variants.length !== 1 ? 's' : ''} Available
              </span>
            </div>
          )}

          <h1 className="mb-4 font-headline text-4xl font-extrabold leading-none tracking-tighter text-on-surface lg:text-5xl">
            {product.name}
          </h1>

          {/* Rating placeholder */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" filled className="text-sm" />
              ))}
            </div>
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              New Product
            </span>
          </div>

          {/* Price */}
          <div className="mb-8">
            <span className="font-headline text-3xl font-bold text-primary lg:text-4xl">
              ${displayPrice}
            </span>
            {selectedVariant && Number(selectedVariant.price) !== Number(product.basePrice) && (
              <span className="ml-3 text-lg font-light text-zinc-400 line-through">
                ${Number(product.basePrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Variants Selection */}
          {product.variants.length > 0 ? (
            <div className="mb-8">
              <VariantSelector
                variants={product.variants}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                selectedMaterial={selectedMaterial}
                onSelectColor={setSelectedColor}
                onSelectSize={setSelectedSize}
                onSelectMaterial={setSelectedMaterial}
              />
            </div>
          ) : (
            <div className="mb-8 rounded-lg border border-dashed border-zinc-300 p-6 text-center font-label text-xs uppercase tracking-widest text-zinc-400">
              No variants available
            </div>
          )}

          {/* Combination not found */}
          {selectedColor && selectedSize && selectedMaterial && !selectedVariant && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-center font-label text-xs font-bold uppercase tracking-widest text-yellow-800">
              This combination is not available.
            </div>
          )}

          {/* Stock Status & CTA */}
          <div className="mt-auto">
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
                  Only {selectedVariant.stock} in stock — Order soon
                </span>
              </div>
            )}
            {selectedVariant && selectedVariant.stock > 5 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-green-600">
                  In stock ({selectedVariant.stock} available)
                </span>
              </div>
            )}
            {selectedVariant && selectedVariant.stock === 0 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-zinc-400" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Out of stock
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!selectedVariant || selectedVariant.stock === 0) return;
                  addItem({
                    productId: product.id,
                    productName: product.name,
                    productImage: product.imageUrl,
                    variantId: selectedVariant.id,
                    combinationKey: selectedVariant.combinationKey,
                    color: selectedVariant.color,
                    size: selectedVariant.size,
                    material: selectedVariant.material,
                    price: Number(selectedVariant.price),
                    stock: selectedVariant.stock,
                  });
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="group relative flex-1 overflow-hidden rounded-lg bg-primary py-4 font-label text-base font-black uppercase tracking-widest text-on-primary shadow-lg transition-all duration-200 hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">
                  {addedToCart
                    ? 'Added to Cart!'
                    : !selectedVariant
                      ? 'Select Options'
                      : selectedVariant.stock === 0
                        ? 'Out of Stock'
                        : 'Add to Cart'}
                </span>
                <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
              </button>
              <button
                onClick={() => selectedVariant && setQuickBuyOpen(true)}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="rounded-lg border-2 border-zinc-200 px-5 font-label text-xs font-bold uppercase tracking-widest transition-colors hover:bg-zinc-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Quick Buy
              </button>
              <button
                className="rounded-lg border-2 border-zinc-100 px-5 transition-colors hover:bg-zinc-50 active:scale-95"
                aria-label="Add to favorites"
              >
                <Icon name="favorite" className="text-zinc-900" />
              </button>
            </div>

            {/* Info badges */}
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <Icon name="local_shipping" className="text-sm" />
                <span>Free express delivery on orders over $500</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <Icon name="verified_user" className="text-sm" />
                <span>Manufacturer warranty included</span>
              </div>
              {totalStock > 0 && (
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <Icon name="inventory_2" className="text-sm" />
                  <span>{totalStock} total units across all variants</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: Description & Details */}
      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Description */}
        <div className="editorial-shadow rounded-xl bg-white p-8 md:col-span-2 md:p-10">
          <h3 className="mb-5 font-headline text-2xl font-black tracking-tight">
            Product Description
          </h3>
          <div className="space-y-4 font-body leading-relaxed text-on-surface-variant">
            <p>{product.description}</p>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="rounded-xl bg-surface-container-low p-8">
          <h3 className="mb-6 border-b border-zinc-200 pb-3 font-headline text-lg font-bold tracking-tight">
            Specifications
          </h3>
          <div className="space-y-5">
            <div className="flex justify-between border-b border-zinc-200/50 pb-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                Base Price
              </span>
              <span className="text-sm font-semibold">
                ${Number(product.basePrice).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-200/50 pb-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                Variants
              </span>
              <span className="text-sm font-semibold">
                {product.variants.length}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-200/50 pb-2">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                Total Stock
              </span>
              <span className="text-sm font-semibold">{totalStock} units</span>
            </div>
            {product.variants.length > 0 && (
              <>
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Colors
                  </span>
                  <span className="text-sm font-semibold">
                    {[...new Set(product.variants.map((v) => v.color))].length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Sizes
                  </span>
                  <span className="text-sm font-semibold">
                    {[...new Set(product.variants.map((v) => v.size))].length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Materials
                  </span>
                  <span className="text-sm font-semibold">
                    {[...new Set(product.variants.map((v) => v.material))].length}
                  </span>
                </div>
              </>
            )}
            {product.createdAt && (
              <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                <span className="font-label text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Listed
                </span>
                <span className="text-sm font-semibold">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Details Table */}
      {product.variants.length > 0 && (
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="mb-1 font-headline text-2xl font-black tracking-tight lg:text-3xl">
              All Variants
            </h2>
            <p className="font-label text-xs uppercase tracking-widest text-zinc-500">
              Complete product configuration options
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {product.variants.map((variant) => (
              <div
                key={variant.id}
                className={`editorial-shadow rounded-xl border bg-white p-5 transition-all ${
                  selectedVariant?.id === variant.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-zinc-100'
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-headline text-sm font-bold">
                      {variant.color} / {variant.size} / {variant.material}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-zinc-400">
                      {variant.combinationKey}
                    </p>
                  </div>
                  {variant.stock === 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                      Out
                    </span>
                  ) : variant.stock <= 5 ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-700">
                      Low
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                      In Stock
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-headline text-xl font-bold text-primary">
                    ${Number(variant.price).toFixed(2)}
                  </span>
                  <span className="font-label text-xs text-zinc-500">
                    {variant.stock} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Buy Modal */}
      {selectedVariant && (
        <QuickBuy
          product={product}
          variant={selectedVariant}
          open={quickBuyOpen}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}
    </main>
  );
}
