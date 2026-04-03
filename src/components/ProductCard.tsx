import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Variant } from '../types';
import ProductImage from './ProductImage';
import Icon from './Icon';
import QuickBuy from './QuickBuy';
import { getVariantColorHex } from '../utils/variantColors';

const priceFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const variants = product.variants;
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

  /** Disabled only when every variant with this option value is out of stock. */
  const isOptionDisabled = (
    dimension: 'color' | 'size' | 'material',
    value: string,
  ): boolean => !variants.some((v) => v[dimension] === value && v.stock > 0);

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
    variants.length > 0 && variants.every((v) => v.stock === 0);

  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const canQuickBuy =
    selectedVariant && selectedVariant.stock > 0 && variants.length > 0;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    setQuickBuyOpen(true);
  };

  return (
    <article className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-3 pb-0">
        <Link
          to={`/products/${product.id}`}
          className="relative block aspect-square overflow-hidden rounded-2xl bg-white"
        >
          <ProductImage
            src={product.images?.[0] || product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-2"
          />
          {allOutOfStock && (
            <span className="absolute top-2 left-2 rounded bg-zinc-800 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-white">
              Out of Stock
            </span>
          )}
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-2">
        <div>
          <Link to={`/products/${product.id}`} className="block min-w-0">
            <h3 className="font-headline text-xl font-bold leading-snug text-zinc-900 transition-colors hover:text-primary">
              {product.name}
            </h3>
          </Link>
          <div
            className="mt-1.5 flex w-fit items-center gap-0.5 rounded-md bg-zinc-100 px-1.5 py-0.5"
            aria-label="Rating 4.9 out of 5"
          >
            <Icon name="star" filled className="text-sm text-amber-500" />
            <span className="font-body text-xs font-normal text-zinc-700">4.9</span>
          </div>
        </div>

        <p className="mt-2 min-h-[2.5rem] line-clamp-2 font-body text-sm font-normal leading-relaxed text-zinc-500">
          {product.description?.trim() ? product.description : '\u00A0'}
        </p>

        {variants.length > 0 && (
          <div className="mt-3 space-y-3">
            {colors.length > 0 && (
              <div>
                <h4 className="mb-2 font-headline text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Available finishes
                </h4>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
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
                        className={`relative h-6 w-6 shrink-0 overflow-hidden rounded-full border-2 transition-all ${
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
                            <div className="h-[2px] w-6 rotate-45 rounded bg-zinc-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 1 && (
              <div>
                <h4 className="mb-1.5 font-headline text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Size
                </h4>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
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
                        className={`rounded-md border px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wide transition ${
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
              </div>
            )}

            {materials.length > 1 && (
              <div>
                <h4 className="mb-1.5 font-headline text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Material
                </h4>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Material">
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
                        className={`max-w-full truncate rounded-md border px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wide transition ${
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
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 border-zinc-100 pt-3">
          <p className="font-body text-lg font-semibold text-primary tabular-nums">
            {priceFmt(displayPrice)}
          </p>
          <button
            type="button"
            onClick={handleQuickBuy}
            disabled={!canQuickBuy}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 font-body text-[10px] font-semibold uppercase tracking-widest text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Quick Buy
          </button>
        </div>
      </div>

      {selectedVariant && (
        <QuickBuy
          product={product}
          variant={selectedVariant}
          open={quickBuyOpen}
          onClose={() => setQuickBuyOpen(false)}
        />
      )}
    </article>
  );
}
