import { useState, useEffect } from 'react';
import type { Product, Variant } from '../types';
import { useCart } from '../store/cart-context';
import Icon from './Icon';

interface QuickAddProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export default function QuickAdd({ product, open, onClose }: QuickAddProps) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [added, setAdded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedVariant(null);
      setAdded(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
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
    setAdded(true);
    setTimeout(handleClose, 800);
  };

  if (!open) return null;

  const inStockVariants = product.variants.filter((v) => v.stock > 0);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-colors duration-150 ${
        visible ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select variant"
    >
      <div
        className={`w-full max-w-sm rounded-t-xl bg-white p-5 shadow-xl transition-all duration-150 sm:rounded-xl ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {added ? (
          <div className="flex items-center gap-2 py-3 text-center">
            <Icon name="check_circle" filled className="text-xl text-green-600" />
            <span className="text-sm font-semibold text-green-700">Added to cart!</span>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{product.name}</h3>
                <p className="text-xs text-zinc-500">Select a variant</p>
              </div>
              <button
                onClick={handleClose}
                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            {inStockVariants.length === 0 ? (
              <p className="py-3 text-center text-xs text-zinc-500">
                All variants are out of stock.
              </p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {inStockVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary bg-primary/5'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium">
                        {variant.color} / {variant.size} / {variant.material}
                      </p>
                      <p className="text-[10px] text-zinc-400">{variant.stock} in stock</p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      ${Number(variant.price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!selectedVariant}
              className="mt-3 w-full rounded bg-primary py-2 text-xs font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:opacity-40"
            >
              Add to Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
