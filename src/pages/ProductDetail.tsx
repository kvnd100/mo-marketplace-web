import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import type { Product, Variant, ApiError } from '../types';
import { AxiosError } from 'axios';
import VariantSelector from '../components/VariantSelector';
import QuickBuy from '../components/QuickBuy';
import Icon from '../components/Icon';
import { useCart } from '../store/cart-context';
import { useAuth } from '../store/auth-context';

const priceFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem, getCartQuantity } = useCart();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await client.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      const msg =
        err instanceof AxiosError && err.response?.data
          ? Array.isArray((err.response.data as ApiError).message)
            ? ((err.response.data as ApiError).message as string[]).join(', ')
            : (err.response.data as ApiError).message
          : 'Failed to delete product.';
      setError(typeof msg === 'string' ? msg : 'Failed to delete product.');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

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

  // Auto-select dimensions that only have one option
  useEffect(() => {
    if (!product) return;
    const uniqueColors = [...new Set(product.variants.map((v) => v.color))];
    const uniqueSizes = [...new Set(product.variants.map((v) => v.size))];
    const uniqueMaterials = [...new Set(product.variants.map((v) => v.material))];
    if (uniqueColors.length === 1) setSelectedColor(uniqueColors[0]);
    if (uniqueSizes.length === 1) setSelectedSize(uniqueSizes[0]);
    if (uniqueMaterials.length === 1) setSelectedMaterial(uniqueMaterials[0]);
  }, [product]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedColor, selectedSize, selectedMaterial]);

  /* ── Loading skeleton ─────────────────────────────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-20">
        <div className="mb-4 h-3 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="aspect-square animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-px bg-zinc-200" />
            <div className="h-10 w-40 animate-pulse rounded bg-zinc-200" />
            <div className="space-y-3 pt-4">
              <div className="h-12 animate-pulse rounded bg-zinc-100" />
              <div className="h-12 animate-pulse rounded bg-zinc-100" />
              <div className="h-12 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-64 animate-pulse rounded-lg bg-zinc-100" />
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
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-tighter text-on-surface">404</h1>
          <p className="mt-3 text-lg text-zinc-500">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-label text-xs font-black uppercase tracking-widest text-on-primary transition hover:bg-primary-container active:scale-95"
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
          <p className="mt-3 text-on-error-container">{error ?? 'Something went wrong.'}</p>
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
          (v) => v.color === selectedColor && v.size === selectedSize && v.material === selectedMaterial,
        )
      : undefined;

  const hasVariants = product.variants.length > 0;
  const allOutOfStock = hasVariants && product.variants.every((v) => v.stock - getCartQuantity(v.id, product.id) <= 0);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice);
  const rating = Number(product.rating ?? 4.5);
  const reviewCount = product.reviewCount ?? 0;

  // For products without variants, allow purchasing at base price
  const canBuyBase = !hasVariants;
  const baseStock = (product.stock ?? 0) - getCartQuantity(null, product.id);
  const variantEffectiveStock = selectedVariant
    ? selectedVariant.stock - getCartQuantity(selectedVariant.id, product.id)
    : 0;
  const baseMaxQty = canBuyBase ? Math.min(baseStock, 30) : 0;
  const maxQty = selectedVariant ? Math.min(variantEffectiveStock, 30) : baseMaxQty;

  const handleAddToCart = () => {
    if (canBuyBase) {
      if (baseStock <= 0) return;
      for (let i = 0; i < quantity; i++) {
        addItem({
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || product.imageUrl,
          variantId: null,
          combinationKey: null,
          color: null,
          size: null,
          material: null,
          price: Number(product.basePrice),
          stock: product.stock ?? 0,
        });
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      return;
    }
    if (!selectedVariant || variantEffectiveStock <= 0) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        productName: product.name,
        productImage: selectedVariant.imageUrl || product.images?.[0] || product.imageUrl,
        variantId: selectedVariant.id,
        combinationKey: selectedVariant.combinationKey,
        color: selectedVariant.color,
        size: selectedVariant.size,
        material: selectedVariant.material,
        price: Number(selectedVariant.price),
        stock: selectedVariant.stock,
      });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <main className="mx-auto max-w-7xl pt-20 pb-20 sm:px-6 lg:px-8">
      {/* Breadcrumb + Actions */}
      <div className="mb-4 flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Link to="/products" className="transition hover:text-primary hover:underline">Products</Link>
          <Icon name="chevron_right" className="text-xs text-zinc-300" />
          {product.category && (
            <>
              <span className="text-zinc-500">{product.category}</span>
              <Icon name="chevron_right" className="text-xs text-zinc-300" />
            </>
          )}
          <span className="text-zinc-400 truncate max-w-50">{product.name}</span>
        </nav>
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Link
              to={`/products/${product.id}/edit`}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 active:scale-95"
            >
              <Icon name="edit" className="text-sm" />
              Edit
            </Link>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
            >
              <Icon name="delete" className="text-sm" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ── 3-Column Amazon Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* LEFT: Product Image */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            {(() => {
              const productImages = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
              const variantImages = [...new Set(
                product.variants.map((v) => v.imageUrl).filter((url): url is string => !!url && !productImages.includes(url))
              )];
              const allImages = [...productImages, ...variantImages];
              const variantImage = selectedVariant?.imageUrl || null;
              const displayImage = variantImage || allImages[selectedImageIndex] || null;
              const activeThumbIndex = variantImage ? allImages.indexOf(variantImage) : selectedImageIndex;
              return (
                <>
                  <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="aspect-square w-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-zinc-50">
                        <Icon name="image" className="text-7xl text-zinc-300" />
                      </div>
                    )}
                    {allOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-lg bg-zinc-900 px-6 py-3 font-headline text-lg font-bold text-white">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {allImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {allImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedImageIndex(i)}
                          className={`overflow-hidden rounded border-2 bg-white p-1 transition ${
                            activeThumbIndex === i ? 'border-primary' : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <img src={img} alt="" className="aspect-square w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                  {allImages.length === 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      <div className="flex items-center justify-center overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-1">
                        <div className="flex aspect-square w-full items-center justify-center text-zinc-300">
                          <Icon name="image" className="text-lg" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* MIDDLE: Product Info + Variants */}
        <div className="lg:col-span-4">
          {/* Title */}
          <h1 className="font-headline text-2xl font-bold leading-tight text-on-surface lg:text-[1.7rem]">
            {product.name}
          </h1>

          {/* Brand */}
          {product.brand && (
            <p className="mt-1 text-sm">
              Brand: <span className="text-primary">{product.brand}</span>
            </p>
          )}

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{rating.toFixed(1)}</span>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.floor(rating);
                const half = !filled && i < rating;
                return (
                  <Icon
                    key={i}
                    name={half ? 'star_half' : 'star'}
                    filled={filled || half}
                    className={`text-base ${filled || half ? 'text-amber-400' : 'text-zinc-200'}`}
                  />
                );
              })}
            </div>
            {reviewCount > 0 && (
              <span className="text-sm text-primary">{reviewCount.toLocaleString()} ratings</span>
            )}
          </div>

          {/* Variant count badge */}
          {product.variants.length > 0 && !allOutOfStock && (
            <p className="mt-2 text-xs text-zinc-500">
              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
            </p>
          )}

          <hr className="my-4 border-zinc-200" />

          {/* Price section */}
          <div className="mb-1">
            {selectedVariant && Number(selectedVariant.price) < Number(product.basePrice) && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-zinc-500">List Price:</span>
                <span className="text-sm text-zinc-400 line-through">{priceFmt(Number(product.basePrice))}</span>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-zinc-500">Price:</span>
              <span className="font-headline text-3xl font-bold text-on-surface">
                {priceFmt(displayPrice)}
              </span>
            </div>
            {selectedVariant && Number(selectedVariant.price) < Number(product.basePrice) && (
              <p className="mt-0.5 text-xs text-green-700">
                You save: {priceFmt(Number(product.basePrice) - Number(selectedVariant.price))} ({Math.round(((Number(product.basePrice) - Number(selectedVariant.price)) / Number(product.basePrice)) * 100)}%)
              </p>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <Icon name="local_shipping" className="text-sm" />
            <span>{displayPrice >= 500 ? 'FREE delivery' : 'FREE delivery on orders over $500'}</span>
          </div>

          <hr className="my-4 border-zinc-200" />

          {/* Variant Selection */}
          {product.variants.length > 0 ? (
            <VariantSelector
              variants={product.variants}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              selectedMaterial={selectedMaterial}
              onSelectColor={setSelectedColor}
              onSelectSize={setSelectedSize}
              onSelectMaterial={setSelectedMaterial}
            />
          ) : null}

          {/* Combination not found */}
          {selectedColor && selectedSize && selectedMaterial && !selectedVariant && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-center text-xs font-semibold text-yellow-800">
              This combination is not available.
            </div>
          )}

          <hr className="my-6 border-zinc-200" />

          {/* About This Item */}
          <div>
            <h3 className="mb-3 text-base font-bold text-on-surface">About this item</h3>
            <p className="text-sm leading-relaxed text-zinc-600">{product.description}</p>
          </div>
        </div>

        {/* RIGHT: Buy Box */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 rounded-lg border border-zinc-200 bg-white p-5">
            {/* Price in buy box */}
            <p className="font-headline text-2xl font-bold text-on-surface">
              {priceFmt(displayPrice)}
            </p>

            {/* Delivery info */}
            <div className="mt-3 space-y-1.5 text-sm">
              {displayPrice >= 500 ? (
                <p className="text-green-700">
                  <Icon name="local_shipping" className="mr-1 align-middle text-sm" />
                  FREE delivery
                </p>
              ) : (
                <p className="text-zinc-600">
                  <Icon name="local_shipping" className="mr-1 align-middle text-sm" />
                  Delivery: $9.99
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Arrives in 3-5 business days
              </p>
            </div>

            <hr className="my-4 border-zinc-100" />

            {/* Stock status */}
            {canBuyBase ? (
              baseStock > 0 ? (
                <p className="text-lg font-semibold text-green-700">In Stock</p>
              ) : (
                <p className="text-lg font-semibold text-red-600">Out of Stock</p>
              )
            ) : selectedVariant ? (
              variantEffectiveStock > 0 ? (
                <p className="text-lg font-semibold text-green-700">In Stock</p>
              ) : (
                <p className="text-lg font-semibold text-red-600">Out of Stock</p>
              )
            ) : (
              <p className="text-sm text-zinc-500">Select options above</p>
            )}

            {canBuyBase && baseStock > 0 && baseStock <= 5 && (
              <p className="mt-1 text-xs font-medium text-primary">
                Only {baseStock} left in stock - order soon.
              </p>
            )}
            {selectedVariant && variantEffectiveStock > 0 && variantEffectiveStock <= 5 && (
              <p className="mt-1 text-xs font-medium text-primary">
                Only {variantEffectiveStock} left in stock - order soon.
              </p>
            )}

            {/* Quantity selector */}
            {((canBuyBase && baseStock > 0) || (selectedVariant && variantEffectiveStock > 0)) && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-zinc-600">Quantity:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Qty: {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              disabled={(canBuyBase && baseStock <= 0) || (!canBuyBase && (!selectedVariant || variantEffectiveStock <= 0))}
              className="mt-4 w-full rounded-full bg-amber-400 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addedToCart
                ? 'Added to Cart!'
                : canBuyBase
                  ? baseStock <= 0 ? 'Out of Stock' : 'Add to Cart'
                  : !selectedVariant
                    ? 'Select Options'
                    : variantEffectiveStock <= 0
                      ? 'Out of Stock'
                      : 'Add to Cart'}
            </button>

            {/* Buy Now / Quick Buy */}
            <button
              onClick={() => ((canBuyBase && baseStock > 0) || (selectedVariant && variantEffectiveStock > 0)) && setQuickBuyOpen(true)}
              disabled={(canBuyBase && baseStock <= 0) || (!canBuyBase && (!selectedVariant || variantEffectiveStock <= 0))}
              className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>

            {/* Extra info */}
            <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4">
              <div className="flex items-start gap-2.5 text-xs text-zinc-600">
                <Icon name="verified_user" className="mt-0.5 text-sm text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-800">Secure transaction</p>
                  <p className="text-zinc-500">Your information is safe</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-600">
                <Icon name="undo" className="mt-0.5 text-sm text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-800">Return policy</p>
                  <p className="text-zinc-500">Returnable within 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-zinc-600">
                <Icon name="support_agent" className="mt-0.5 text-sm text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-800">Customer support</p>
                  <p className="text-zinc-500">MO Marketplace</p>
                </div>
              </div>
            </div>

            {/* Add to favorites */}
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50">
              <Icon name="favorite_border" className="text-base" />
              Add to Wish List
            </button>
          </div>
        </div>
      </div>

      {/* ── Product Details Sections (below the fold) ── */}
      <div className="mt-12 border-t border-zinc-200 pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* Specifications */}
          <div className="lg:col-span-5">
            <h2 className="mb-4 text-lg font-bold text-on-surface">Product Information</h2>
            <div className="rounded-lg border border-zinc-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {product.brand && (
                    <tr className="border-b border-zinc-100">
                      <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Brand</td>
                      <td className="px-4 py-2.5 text-zinc-800">{product.brand}</td>
                    </tr>
                  )}
                  {product.category && (
                    <tr className="border-b border-zinc-100">
                      <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Category</td>
                      <td className="px-4 py-2.5 text-zinc-800">{product.category}</td>
                    </tr>
                  )}
                  <tr className="border-b border-zinc-100">
                    <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Condition</td>
                    <td className="px-4 py-2.5 capitalize text-zinc-800">{product.condition || 'New'}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Base Price</td>
                    <td className="px-4 py-2.5 text-zinc-800">{priceFmt(Number(product.basePrice))}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Variants</td>
                    <td className="px-4 py-2.5 text-zinc-800">{product.variants.length}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Total Stock</td>
                    <td className="px-4 py-2.5 text-zinc-800">{hasVariants ? totalStock : (product.stock ?? 0)} units</td>
                  </tr>
                  {product.variants.length > 0 && (
                    <>
                      <tr className="border-b border-zinc-100">
                        <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Colors</td>
                        <td className="px-4 py-2.5 text-zinc-800">
                          {[...new Set(product.variants.map((v) => v.color))].join(', ')}
                        </td>
                      </tr>
                      <tr className="border-b border-zinc-100">
                        <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Sizes</td>
                        <td className="px-4 py-2.5 text-zinc-800">
                          {[...new Set(product.variants.map((v) => v.size))].join(', ')}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-zinc-50 px-4 py-2.5 font-medium text-zinc-600">Materials</td>
                        <td className="px-4 py-2.5 text-zinc-800">
                          {[...new Set(product.variants.map((v) => v.material))].join(', ')}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-7">
            <h2 className="mb-4 text-lg font-bold text-on-surface">Product Description</h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-sm leading-relaxed text-zinc-600">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Variant Details Grid ── */}
      {product.variants.length > 0 && (
        <section className="mt-12 border-t border-zinc-200 pt-8">
          <h2 className="mb-1 text-lg font-bold text-on-surface">All Variants</h2>
          <p className="mb-6 text-xs text-zinc-500">
            {product.variants.length} configuration{product.variants.length !== 1 ? 's' : ''} available
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedColor(variant.color);
                  setSelectedSize(variant.size);
                  setSelectedMaterial(variant.material);
                }}
                className={`rounded-lg border bg-white p-4 text-left transition-all hover:shadow-sm ${
                  selectedVariant?.id === variant.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800">
                      {variant.color} / {variant.size}
                    </p>
                    <p className="text-xs text-zinc-500">{variant.material}</p>
                  </div>
                  {variant.stock === 0 ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Out</span>
                  ) : variant.stock <= 5 ? (
                    <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">Low</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">In Stock</span>
                  )}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-lg font-bold text-on-surface">{priceFmt(Number(variant.price))}</span>
                  <span className="text-xs text-zinc-400">{variant.stock} units</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quick Buy Modal */}
      {(selectedVariant || canBuyBase) && (
        <QuickBuy
          product={product}
          variant={selectedVariant ?? null}
          open={quickBuyOpen}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Icon name="delete" className="text-2xl text-red-600" />
            </div>
            <h3 className="text-center text-lg font-bold text-on-surface">Delete Product</h3>
            <p className="mt-2 text-center text-sm text-zinc-500">
              This will permanently delete <span className="font-semibold text-zinc-700">{product.name}</span> and all its variants.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
