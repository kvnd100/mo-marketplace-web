import { Link } from 'react-router-dom';
import { useCart } from '../store/cart-context';
import Icon from '../components/Icon';
import ProductImage from '../components/ProductImage';

export default function Cart() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="px-4 pt-20 pb-10 text-center">
        <div className="py-16">
          <Icon name="shopping_cart" className="mx-auto text-5xl text-zinc-300" />
          <h2 className="mt-4 font-headline text-xl font-bold text-on-surface">
            Your cart is empty
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Browse products and add items to your cart.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-block rounded bg-primary px-5 py-2 text-xs font-bold text-on-primary transition hover:bg-primary-container active:scale-95"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-16 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-headline text-xl font-bold text-on-surface">
          Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-zinc-500 transition hover:text-error"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4"
            >
              {/* Product image */}
              <Link
                to={`/products/${item.productId}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded bg-zinc-50"
              >
                <ProductImage
                  src={item.productImage}
                  alt={item.productName}
                  className="h-full w-full object-contain p-1"
                  iconSize="text-2xl"
                />
              </Link>

              {/* Details */}
              <div className="flex flex-1 flex-col">
                <Link
                  to={`/products/${item.productId}`}
                  className="text-sm font-semibold text-on-surface hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {item.color} / {item.size} / {item.material}
                </p>
                <p className="mt-1 font-headline text-base font-bold text-primary">
                  ${item.price.toFixed(2)}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-sm transition hover:bg-zinc-50"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-sm transition hover:bg-zinc-50 disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    {item.stock <= 5 && (
                      <span className="ml-2 text-[10px] font-semibold text-primary">
                        {item.stock} left
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs font-medium text-zinc-500 transition hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-16 rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 font-headline text-base font-bold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal ({totalItems} items)</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Shipping</span>
                <span className="font-medium text-green-600">
                  {totalPrice >= 500 ? 'Free' : '$9.99'}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-on-surface">Total</span>
                  <span className="font-headline text-lg font-bold text-primary">
                    ${(totalPrice + (totalPrice >= 500 ? 0 : 9.99)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full rounded bg-primary py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98]">
              Proceed to Checkout
            </button>
            {totalPrice < 500 && (
              <p className="mt-2 text-center text-[10px] text-zinc-500">
                Add ${(500 - totalPrice).toFixed(2)} more for free shipping
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
