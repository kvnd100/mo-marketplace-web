import { useState, useEffect } from 'react';
import type { Product, Variant } from '../types';
import Icon from './Icon';
import { useCart } from '../store/cart-context';

interface QuickBuyProps {
  product: Product;
  variant: Variant;
  open: boolean;
  onClose: () => void;
}

export default function QuickBuy({ product, variant, open, onClose }: QuickBuyProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (open) {
      setConfirmed(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: variant.id,
      combinationKey: variant.combinationKey,
      color: variant.color,
      size: variant.size,
      material: variant.material,
      price: Number(variant.price),
      stock: variant.stock,
    });
    setConfirmed(true);
  };

  if (!open) return null;

  const isOutOfStock = variant.stock === 0;

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
        className={`editorial-shadow w-full max-w-md transform rounded-2xl bg-white p-8 transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {confirmed ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Icon name="check_circle" filled className="text-4xl text-green-600" />
            </div>
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              Order Confirmed!
            </h2>
            <p className="mt-2 font-body text-sm text-zinc-500">
              Your order for <span className="font-semibold text-on-surface">{product.name}</span>{' '}
              ({variant.combinationKey}) has been placed successfully.
            </p>
            <button
              onClick={handleClose}
              className="mt-8 w-full rounded-lg bg-inverse-surface py-3 font-label text-sm font-black uppercase tracking-widest text-inverse-on-surface transition hover:bg-zinc-700 active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                Quick Buy
              </h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-surface-container-low p-5">
              <h3 className="font-headline font-bold text-on-surface">{product.name}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Color
                  </span>
                  <span className="text-sm font-semibold">{variant.color}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Size
                  </span>
                  <span className="text-sm font-semibold">{variant.size}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Material
                  </span>
                  <span className="text-sm font-semibold">{variant.material}</span>
                </div>
                {variant.sku && (
                  <div className="flex justify-between border-b border-zinc-200/50 pb-2">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      SKU
                    </span>
                    <span className="font-mono text-sm font-semibold">{variant.sku}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                <span className="font-label text-xs text-zinc-500">
                  {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                </span>
                <span className="font-headline text-2xl font-bold text-primary">
                  ${Number(variant.price).toFixed(2)}
                </span>
              </div>
            </div>

            {isOutOfStock && (
              <div className="mt-4 rounded-lg bg-error-container p-3 text-center font-label text-xs font-bold uppercase tracking-widest text-on-error-container">
                This variant is currently out of stock.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border-2 border-zinc-100 py-3 font-label text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isOutOfStock}
                className="group relative flex-1 overflow-hidden rounded-lg bg-primary py-3 font-label text-sm font-black uppercase tracking-widest text-on-primary transition-all hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">
                  {isOutOfStock ? 'Unavailable' : 'Confirm Purchase'}
                </span>
                <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
