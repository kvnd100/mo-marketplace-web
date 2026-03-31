import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import client from '../api/client';
import type { Product } from '../types';
import { AxiosError } from 'axios';
import type { ApiError } from '../types';
import Icon from '../components/Icon';

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
          if (err instanceof AxiosError && err.response?.data) {
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
    'w-full rounded-lg border border-zinc-200 bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface placeholder-zinc-400 transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-20">
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-black tracking-tight text-on-surface">
          Create Product
        </h1>
        <p className="mt-1 font-label text-xs uppercase tracking-widest text-zinc-500">
          Add a new product with variants
        </p>
      </div>

      {apiError && (
        <div className="mb-8 flex items-start gap-2 rounded-xl bg-error-container p-4" role="alert">
          <Icon name="error" className="mt-0.5 text-sm text-on-error-container" />
          <span className="font-body text-sm text-on-error-container">{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Product Info */}
        <section className="editorial-shadow rounded-xl bg-white p-8">
          <h2 className="mb-6 font-headline text-xl font-bold tracking-tight text-on-surface">
            Product Information
          </h2>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
              >
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
                <p className="mt-1.5 font-body text-xs text-error" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className={inputClass}
                placeholder="Describe your product..."
                {...register('description')}
                aria-invalid={errors.description ? 'true' : 'false'}
              />
              {errors.description && (
                <p className="mt-1.5 font-body text-xs text-error" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="basePrice"
                  className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                >
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
                  <p className="mt-1.5 font-body text-xs text-error" role="alert">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="imageUrl"
                  className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                >
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
                  <p className="mt-1.5 font-body text-xs text-error" role="alert">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Variants */}
        <section className="editorial-shadow rounded-xl bg-white p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">
              Variants
            </h2>
            <button
              type="button"
              onClick={() =>
                append({ color: '', size: '', material: '', price: 0, stock: 0 })
              }
              className="rounded-lg border-2 border-zinc-100 px-5 py-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface transition hover:bg-zinc-50 active:scale-95"
            >
              + Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={`rounded-xl border p-6 ${
                  variantErrors[index]
                    ? 'border-error/30 bg-error-container/30'
                    : 'border-zinc-200 bg-surface-container-low'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
                      className="font-label text-[10px] font-bold uppercase tracking-widest text-error transition hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {variantErrors[index] && (
                  <div
                    className="mb-4 flex items-center gap-2 rounded-lg bg-error-container p-2.5"
                    role="alert"
                  >
                    <Icon name="error" className="text-sm text-on-error-container" />
                    <span className="font-body text-xs text-on-error-container">
                      {variantErrors[index]}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Color
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Red"
                      {...register(`variants.${index}.color`)}
                      aria-invalid={errors.variants?.[index]?.color ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.color && (
                      <p className="mt-1.5 font-body text-xs text-error" role="alert">
                        {errors.variants[index].color.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Size
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. M"
                      {...register(`variants.${index}.size`)}
                      aria-invalid={errors.variants?.[index]?.size ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.size && (
                      <p className="mt-1.5 font-body text-xs text-error" role="alert">
                        {errors.variants[index].size.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Material
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Cotton"
                      {...register(`variants.${index}.material`)}
                      aria-invalid={errors.variants?.[index]?.material ? 'true' : 'false'}
                    />
                    {errors.variants?.[index]?.material && (
                      <p className="mt-1.5 font-body text-xs text-error" role="alert">
                        {errors.variants[index].material.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
                      <p className="mt-1.5 font-body text-xs text-error" role="alert">
                        {errors.variants[index].price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
                      <p className="mt-1.5 font-body text-xs text-error" role="alert">
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
          className="group relative w-full overflow-hidden rounded-lg bg-primary py-4 font-label text-lg font-black uppercase tracking-widest text-on-primary shadow-lg transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-50"
        >
          <span className="relative z-10">
            {submitting ? 'Creating...' : 'Create Product'}
          </span>
          <div className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
        </button>
      </form>
    </div>
  );
}
