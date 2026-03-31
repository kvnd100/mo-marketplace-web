import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import type { Product, Variant } from '../types';
import VariantSelector from '../components/VariantSelector';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  useEffect(() => {
    client
      .get<Product>(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load product.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-6 w-1/4 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
              <div className="h-10 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-500">Product not found.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
          {error ?? 'Something went wrong.'}
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Products
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-24 w-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-red-600">
            $
            {selectedVariant
              ? Number(selectedVariant.price).toFixed(2)
              : Number(product.basePrice).toFixed(2)}
          </p>
          {selectedVariant && (
            <p className="mt-1 text-sm text-gray-500">
              Base price: ${Number(product.basePrice).toFixed(2)}
            </p>
          )}

          <p className="mt-4 text-gray-600">{product.description}</p>

          {product.variants.length > 0 && (
            <div className="mt-6">
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
          )}

          {/* TODO: Quick Buy button*/}
          {selectedVariant && (
            <button
              disabled={selectedVariant.stock === 0}
              className="mt-6 w-full rounded-lg bg-red-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedVariant.stock === 0 ? 'Out of Stock' : 'Quick Buy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
