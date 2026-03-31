import { useState, useEffect } from 'react';
import type { Product, Variant } from '../types';

interface QuickBuyProps {
  product: Product;
  variant: Variant;
  open: boolean;
  onClose: () => void;
}

export default function QuickBuy({ product, variant, open, onClose }: QuickBuyProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [visible, setVisible] = useState(false);

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
        className={`w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all duration-200 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {confirmed ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your order for {product.name} ({variant.combinationKey}) has been placed
              successfully.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-2.5 font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between">
              <h2 className="text-xl font-bold text-gray-900">Quick Buy</h2>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-700">Color:</span> {variant.color}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Size:</span> {variant.size}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Material:</span> {variant.material}
                </p>
                {variant.sku && (
                  <p>
                    <span className="font-medium text-gray-700">SKU:</span> {variant.sku}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-500">
                  {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                </span>
                <span className="text-xl font-bold text-red-600">
                  ${Number(variant.price).toFixed(2)}
                </span>
              </div>
            </div>

            {isOutOfStock && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                This variant is currently out of stock.
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isOutOfStock}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOutOfStock ? 'Unavailable' : 'Confirm Purchase'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
