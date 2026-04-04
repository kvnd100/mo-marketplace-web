import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Variant } from '../types';
import ProductImage from './ProductImage';
import Icon from './Icon';
import QuickBuy from './QuickBuy';
import { getVariantColorHex } from '../utils/variantColors';
import { useCart } from '../store/cart-context';

const priceFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const variants = product.variants;
  const { getCartQuantity } = useCart();
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color))],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size))],
    [variants],
  );
  const materials = useMemo(
    () => [...new Set(variants.map((v) => v.material))],
    [variants],
  );

  const findVariant = (
    color: string | null,
    size: string | null,
    material: string | null,
  ): Variant | undefined =>
    variants.find(
      (v) => v.color === color && v.size === size && v.material === material,
    );

  const effectiveVariantStock = (v: Variant) =>
    v.stock - getCartQuantity(v.id, product.id);

  /** Disabled only when every variant with this option value is out of effective stock. */
  const isOptionDisabled = (
    dimension: 'color' | 'size' | 'material',
    value: string,
  ): boolean => !variants.some((v) => v[dimension] === value && effectiveVariantStock(v) > 0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const first = variants.find((v) => v.stock > 0);
    if (first) {
      setSelectedColor(first.color);
      setSelectedSize(first.size);
      setSelectedMaterial(first.material);
    } else {
      setSelectedColor(null);
      setSelectedSize(null);
      setSelectedMaterial(null);
    }
  }, [product.id, variants]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resolveAfterColor = (color: string) => {
    const withColor = variants.filter((v) => v.color === color && v.stock > 0);
    const keep = withColor.find(
      (v) => v.size === selectedSize && v.material === selectedMaterial,
    );
    if (keep) return;
    const next = withColor[0];
    if (next) {
      setSelectedSize(next.size);
      setSelectedMaterial(next.material);
    }
  };

  const resolveAfterSize = (size: string) => {
    const withSize = variants.filter((v) => v.size === size && v.stock > 0);
    const keep = withSize.find(
      (v) => v.color === selectedColor && v.material === selectedMaterial,
    );
    if (keep) return;
    const next = withSize[0];
    if (next) {
      setSelectedColor(next.color);
      setSelectedMaterial(next.material);
    }
  };

  const resolveAfterMaterial = (material: string) => {
    const withMat = variants.filter((v) => v.material === material && v.stock > 0);
    const keep = withMat.find(
      (v) => v.color === selectedColor && v.size === selectedSize,
    );
    if (keep) return;
    const next = withMat[0];
    if (next) {
      setSelectedColor(next.color);
      setSelectedSize(next.size);
    }
  };

  const selectedVariant =
    selectedColor && selectedSize && selectedMaterial
      ? findVariant(selectedColor, selectedSize, selectedMaterial)
      : undefined;

  const allOutOfStock =
    variants.length > 0 && variants.every((v) => effectiveVariantStock(v) <= 0);

  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const canBuyBase = variants.length === 0;
  const baseEffectiveStock = canBuyBase ? (product.stock ?? 0) - getCartQuantity(null, product.id) : 0;
  const selectedEffectiveStock = selectedVariant ? effectiveVariantStock(selectedVariant) : 0;
  const canQuickBuy =
    (canBuyBase && baseEffectiveStock > 0) || (selectedVariant && selectedEffectiveStock > 0);

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canQuickBuy) return;
    setQuickBuyOpen(true);
  };

  const ratingDisplay =
    product.rating != null && product.rating > 0 ? product.rating.toFixed(1) : null;

  const displayImage = selectedVariant?.imageUrl || product.images?.[0] || product.imageUrl;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <div className="px-3 pt-3">
        <Link
          to={`/products/${product.id}`}
          className="relative block w-full overflow-hidden rounded-md bg-zinc-50 aspect-3/4"
        >
          <ProductImage
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-contain p-2 sm:p-2.5"
          />
          {allOutOfStock && (
            <span className="absolute top-2 left-2 rounded bg-zinc-800 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-white">
              Out of Stock
            </span>
          )}
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2.5">
        <Link to={`/products/${product.id}`} className="block min-w-0">
          <h3 className="line-clamp-3 font-body text-sm font-medium leading-snug text-zinc-900 transition-colors hover:text-primary sm:text-[15px] sm:leading-snug">
            {product.name}
          </h3>
        </Link>

        {ratingDisplay && (
          <div
            className="mt-2 flex w-fit items-center gap-1"
            aria-label={`Rating ${ratingDisplay} out of 5`}
          >
            <Icon name="star" filled className="text-sm text-amber-500" />
            <span className="font-body text-xs text-zinc-600">{ratingDisplay}</span>
          </div>
        )}

        {variants.length > 0 && (
          <div className="mt-2 shrink-0 space-y-2">
            {colors.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color">
                {colors.map((color) => {
                  const disabled = isOptionDisabled('color', color);
                  const active = selectedColor === color;
                  const hex = getVariantColorHex(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedColor(color);
                        resolveAfterColor(color);
                      }}
                      title={color}
                      aria-label={`${color}${disabled ? ' (unavailable)' : ''}`}
                      className={`relative h-5 w-5 shrink-0 overflow-hidden rounded-full border-2 transition-all ${
                        active
                          ? 'border-primary'
                          : disabled
                            ? 'cursor-not-allowed border-zinc-100 opacity-40'
                            : 'border-transparent hover:border-zinc-300'
                      }`}
                    >
                      <div
                        className={`h-full w-full rounded-full shadow-inner ${
                          hex ? '' : 'bg-zinc-300'
                        } ${hex === '#ffffff' ? 'border border-zinc-200' : ''}`}
                        style={hex ? { backgroundColor: hex } : undefined}
                      />
                      {disabled && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="h-[1.5px] w-5 rotate-45 rounded bg-zinc-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {sizes.length > 1 && (
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Size">
                {sizes.map((size) => {
                  const disabled = isOptionDisabled('size', size);
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedSize(size);
                        resolveAfterSize(size);
                      }}
                      className={`rounded border px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide transition ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : disabled
                            ? 'cursor-not-allowed border-zinc-100 text-zinc-300 line-through'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            )}

            {materials.length > 1 && (
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Material">
                {materials.map((material) => {
                  const disabled = isOptionDisabled('material', material);
                  const active = selectedMaterial === material;
                  return (
                    <button
                      key={material}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedMaterial(material);
                        resolveAfterMaterial(material);
                      }}
                      className={`max-w-full truncate rounded border px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide transition ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : disabled
                            ? 'cursor-not-allowed border-zinc-100 text-zinc-300 line-through'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {material}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex shrink-0 items-end justify-between gap-2 border-t border-zinc-100/80 pt-3">
          <p className="font-body text-base font-semibold text-zinc-900 tabular-nums sm:text-lg">
            {priceFmt(displayPrice)}
          </p>
          <button
            type="button"
            onClick={handleQuickBuy}
            disabled={!canQuickBuy}
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-wide text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Quick Buy
          </button>
        </div>
      </div>

      {(selectedVariant || canBuyBase) && (
        <QuickBuy
          product={product}
          variant={selectedVariant ?? null}
          open={quickBuyOpen}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}
    </article>
  );
}
