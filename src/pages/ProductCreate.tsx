import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import client from '../api/client';
import type { Product } from '../types';
import { AxiosError } from 'axios';
import type { ApiError } from '../types';

const variantSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  size: z.string().min(1, 'Size is required'),
  material: z.string().min(1, 'Material is required'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  basePrice: z.number().positive('Base price must be greater than 0'),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  variants: z.array(variantSchema),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductCreate() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      imageUrl: '',
      variants: [{ color: '', size: '', material: '', price: 0, stock: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const onSubmit = async (data: ProductFormData) => {
    setApiError(null);
    setVariantErrors({});
    setSubmitting(true);

    try {
      const { data: product } = await client.post<Product>('/products', {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl || null,
      });

      const variantErrs: Record<number, string> = {};

      for (let i = 0; i < data.variants.length; i++) {
        const variant = data.variants[i];
        try {
          await client.post(`/products/${product.id}/variants`, {
            color: variant.color,
            size: variant.size,
            material: variant.material,
            price: variant.price,
            stock: variant.stock,
          });
        } catch (err) {
          if (err instanceof AxiosError && err.response?.status === 409) {
            const body = err.response.data as ApiError;
            const message = Array.isArray(body.message)
              ? body.message.join(', ')
              : body.message;
            variantErrs[i] = message;
          } else if (err instanceof AxiosError && err.response?.data) {
            const body = err.response.data as ApiError;
            const message = Array.isArray(body.message)
              ? body.message.join(', ')
              : body.message;
            variantErrs[i] = message;
          } else {
            variantErrs[i] = 'Failed to create this variant.';
          }
        }
      }

      if (Object.keys(variantErrs).length > 0) {
        setVariantErrors(variantErrs);
        setApiError(
          `Product created, but ${Object.keys(variantErrs).length} variant(s) failed. Fix the errors below and try creating them from the product page.`,
        );
      } else {
        navigate(`/products/${product.id}`);
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const body = err.response.data as ApiError;
        const message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
        setApiError(message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Create Product</h1>

      {apiError && (
        <div
          className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Product Info */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Product Information
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                className={inputClass}
                placeholder="Product name"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className={inputClass}
                placeholder="Product description"
                {...register('description')}
                aria-invalid={errors.description ? 'true' : 'false'}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="basePrice" className="mb-1 block text-sm font-medium text-gray-700">
                  Base Price ($)
                </label>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  {...register('basePrice', { valueAsNumber: true })}
                  aria-invalid={errors.basePrice ? 'true' : 'false'}
                />
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600" role="alert">{errors.basePrice.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-gray-700">
                  Image URL (optional)
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                  {...register('imageUrl')}
                  aria-invalid={errors.imageUrl ? 'true' : 'false'}
                />
                {errors.imageUrl && (
                  <p className="mt-1 text-sm text-red-600" role="alert">{errors.imageUrl.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Variants */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
            <button
              type="button"
              onClick={() =>
                append({ color: '', size: '', material: '', price: 0, stock: 0 })
              }
              className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              + Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={`rounded-lg border p-4 ${
                  variantErrors[index]
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Variant {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setVariantErrors((prev) => {
                          const next = { ...prev };
                          delete next[index];
                          return next;
                        });
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {variantErrors[index] && (
                  <div
                    className="mb-3 rounded-md bg-red-100 p-2 text-sm text-red-700"
                    role="alert"
                  >
                    {variantErrors[index]}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Color
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Red"
                      {...register(`variants.${index}.color`)}
                      aria-invalid={errors.variants?.[index]?.color ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.color && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.variants[index].color.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Size
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. M"
                      {...register(`variants.${index}.size`)}
                      aria-invalid={errors.variants?.[index]?.size ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.size && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.variants[index].size.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Material
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Cotton"
                      {...register(`variants.${index}.material`)}
                      aria-invalid={errors.variants?.[index]?.material ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.material && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.variants[index].material.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      placeholder="0.00"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      aria-invalid={errors.variants?.[index]?.price ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.variants[index].price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Stock
                    </label>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="0"
                      {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                      aria-invalid={errors.variants?.[index]?.stock ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.stock && (
                      <p className="mt-1 text-xs text-red-600" role="alert">
                        {errors.variants[index].stock.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-red-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
