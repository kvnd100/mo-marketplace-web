import { useState, useEffect } from 'react';
import type { Product, Variant } from '../types';
import Icon from './Icon';
import ProductImage from './ProductImage';
import { useCart } from '../store/cart-context';

interface QuickBuyProps {
  product: Product;
  variant: Variant | null;
  open: boolean;
  onClose: () => void;
}

export default function QuickBuy({ product, variant, open, onClose }: QuickBuyProps) {
  const [added, setAdded] = useState(false);
  const [visible, setVisible] = useState(false);
  const { addItem, getCartQuantity } = useCart();

  useEffect(() => {
    if (open) {
      setAdded(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleAddToCart = () => {
    if (variant) {
      addItem({
        productId: product.id,
        productName: product.name,
        productImage: variant.imageUrl || product.images?.[0] || product.imageUrl,
        variantId: variant.id,
        combinationKey: variant.combinationKey,
        color: variant.color,
        size: variant.size,
        material: variant.material,
        price: Number(variant.price),
        stock: variant.stock,
      });
    } else {
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
    setAdded(true);
  };

  if (!open) return null;

  const effectiveStock = variant
    ? variant.stock - getCartQuantity(variant.id, product.id)
    : (product.stock ?? 0) - getCartQuantity(null, product.id);
  const isOutOfStock = effectiveStock <= 0;
  const displayPrice = variant ? Number(variant.price) : Number(product.basePrice);
  const displayImage = variant?.imageUrl || product.images?.[0] || product.imageUrl;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-colors duration-200 ${
        visible ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Buy"
    >
      <div
        className={`editorial-shadow w-full max-w-sm transform rounded-2xl bg-white p-6 transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {added ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Icon name="check_circle" filled className="text-3xl text-green-600" />
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Added to Cart!
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              <span className="font-semibold text-on-surface">{product.name}</span>
              {variant ? ` — ${variant.color} / ${variant.size}` : ''}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              >
                Continue Shopping
              </button>
              <a
                href="/cart"
                className="flex-1 rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-95"
              >
                View Cart
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                Add to Cart
              </h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="flex gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                <ProductImage
                  src={displayImage}
                  alt={product.name}
                  className="h-full w-full object-contain p-1"
                  iconSize="text-2xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-on-surface">{product.name}</h3>
                {variant && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {variant.color} / {variant.size} / {variant.material}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-headline text-lg font-bold text-primary">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {effectiveStock > 0 ? `${effectiveStock} left` : 'Out of stock'}
                  </span>
                </div>
              </div>
            </div>

            {isOutOfStock && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-center text-xs font-semibold text-red-700">
                This item is currently out of stock.
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
