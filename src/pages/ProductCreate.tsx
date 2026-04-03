import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import client from '../api/client';
import type { Product, Category } from '../types';
import { AxiosError } from 'axios';
import type { ApiError } from '../types';
import Icon from '../components/Icon';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
] as const;

const variantSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  size: z.string().min(1, 'Size is required'),
  material: z.string().min(1, 'Material is required'),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().min(1, 'Description is required'),
  basePrice: z.number().positive('Base price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'used', 'refurbished']),
  images: z.array(z.string().url('Must be a valid URL')).min(0),
  variants: z.array(variantSchema),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductCreate() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageInputs, setImageInputs] = useState<string[]>(['']);

  useEffect(() => {
    client
      .get<Category[]>('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      stock: 0,
      category: '',
      condition: 'new',
      images: [],
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const handleImageChange = (index: number, value: string) => {
    const updated = [...imageInputs];
    updated[index] = value;
    setImageInputs(updated);
    setValue(
      'images',
      updated.filter((url) => url.trim() !== ''),
    );
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, '']);
  };

  const removeImageInput = (index: number) => {
    const updated = imageInputs.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push('');
    setImageInputs(updated);
    setValue(
      'images',
      updated.filter((url) => url.trim() !== ''),
    );
  };

  const onSubmit = async (data: ProductFormData) => {
    setApiError(null);
    setVariantErrors({});
    setSubmitting(true);

    try {
      const { data: product } = await client.post<Product>('/products', {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        stock: data.stock,
        imageUrl: data.images[0] || null,
        images: data.images,
        category: data.category,
        condition: data.condition,
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
            imageUrl: variant.imageUrl || null,
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
    'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-on-surface placeholder-zinc-400 transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  const selectClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-on-surface transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  return (
    <div className="min-h-screen bg-zinc-50 pt-16">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Link to="/products" className="hover:text-primary hover:underline">Products</Link>
            <Icon name="chevron_right" className="text-xs text-zinc-300" />
            <span className="text-zinc-400">New Product</span>
          </nav>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Create Product</h1>
          <p className="mt-1 text-sm text-zinc-500">Add a new product to your catalog. Variants are optional.</p>
        </div>

        {apiError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <Icon name="error" className="mt-0.5 text-sm text-red-600" />
            <span className="text-sm text-red-700">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Info */}
          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h2 className="text-sm font-bold text-on-surface">Product Information</h2>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-zinc-600">Product Name</label>
                  <input id="name" className={inputClass} placeholder="Product name" {...register('name')} aria-invalid={errors.name ? 'true' : 'false'} />
                  {errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="basePrice" className="mb-1.5 block text-xs font-medium text-zinc-600">Base Price ($)</label>
                  <input id="basePrice" type="number" step="0.01" className={inputClass} placeholder="0.00" {...register('basePrice', { valueAsNumber: true })} aria-invalid={errors.basePrice ? 'true' : 'false'} />
                  {errors.basePrice && <p className="mt-1 text-xs text-red-600" role="alert">{errors.basePrice.message}</p>}
                </div>
                <div>
                  <label htmlFor="stock" className="mb-1.5 block text-xs font-medium text-zinc-600">Stock</label>
                  <input id="stock" type="number" className={inputClass} placeholder="0" {...register('stock', { valueAsNumber: true })} aria-invalid={errors.stock ? 'true' : 'false'} />
                  {errors.stock && <p className="mt-1 text-xs text-red-600" role="alert">{errors.stock.message}</p>}
                </div>
                <div>
                  <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-zinc-600">Category</label>
                  <select id="category" className={selectClass} {...register('category')} aria-invalid={errors.category ? 'true' : 'false'}>
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600" role="alert">{errors.category.message}</p>}
                </div>
                <div>
                  <label htmlFor="condition" className="mb-1.5 block text-xs font-medium text-zinc-600">Condition</label>
                  <select id="condition" className={selectClass} {...register('condition')} aria-invalid={errors.condition ? 'true' : 'false'}>
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.condition && <p className="mt-1 text-xs text-red-600" role="alert">{errors.condition.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-zinc-600">Description</label>
                <textarea id="description" rows={4} className={inputClass} placeholder="Describe your product..." {...register('description')} aria-invalid={errors.description ? 'true' : 'false'} />
                {errors.description && <p className="mt-1 text-xs text-red-600" role="alert">{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* Product Images */}
          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Product Images</h2>
                <p className="mt-0.5 text-xs text-zinc-500">{imageInputs.filter((u) => u.trim()).length} image{imageInputs.filter((u) => u.trim()).length !== 1 ? 's' : ''} added</p>
              </div>
              <button
                type="button"
                onClick={addImageInput}
                className="flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 active:scale-95"
              >
                <Icon name="add" className="text-sm" />
                Add Image
              </button>
            </div>
            <div className="space-y-3 p-6">
              {imageInputs.map((url, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        className={inputClass}
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                      />
                      {imageInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageInput(index)}
                          className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Icon name="close" className="text-sm" />
                        </button>
                      )}
                    </div>
                    {index === 0 && url.trim() && (
                      <p className="mt-1 text-[10px] text-zinc-400">This will be the main product image</p>
                    )}
                  </div>
                  {url.trim() && (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              ))}
              {errors.images && <p className="text-xs text-red-600" role="alert">Please enter valid image URLs</p>}
            </div>
          </section>

          {/* Variants */}
          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Variants</h2>
                <p className="mt-0.5 text-xs text-zinc-500">{fields.length} variant{fields.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => append({ color: '', size: '', material: '', price: 0, stock: 0, imageUrl: '' })}
                className="flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 active:scale-95"
              >
                <Icon name="add" className="text-sm" />
                Add Variant
              </button>
            </div>
            <div className="divide-y divide-zinc-100">
              {fields.length === 0 && (
                <div className="p-6 text-center text-sm text-zinc-400">
                  No variants added. The product will be sold at the base price.
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className={`p-6 ${variantErrors[index] ? 'bg-red-50/50' : ''}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold text-zinc-600">
                        {index + 1}
                      </span>
                      Variant
                    </span>
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
                      className="flex items-center gap-1 text-xs font-medium text-red-500 transition hover:text-red-700"
                    >
                      <Icon name="close" className="text-sm" />
                      Remove
                    </button>
                  </div>

                  {variantErrors[index] && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5" role="alert">
                      <Icon name="error" className="text-sm text-red-600" />
                      <span className="text-xs text-red-700">{variantErrors[index]}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-600">Color</label>
                      <input className={inputClass} placeholder="e.g. Red" {...register(`variants.${index}.color`)} />
                      {errors.variants?.[index]?.color && <p className="mt-1 text-xs text-red-600">{errors.variants[index].color.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-600">Size</label>
                      <input className={inputClass} placeholder="e.g. M" {...register(`variants.${index}.size`)} />
                      {errors.variants?.[index]?.size && <p className="mt-1 text-xs text-red-600">{errors.variants[index].size.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-600">Material</label>
                      <input className={inputClass} placeholder="e.g. Cotton" {...register(`variants.${index}.material`)} />
                      {errors.variants?.[index]?.material && <p className="mt-1 text-xs text-red-600">{errors.variants[index].material.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-600">Price ($)</label>
                      <input type="number" step="0.01" className={inputClass} placeholder="0.00" {...register(`variants.${index}.price`, { valueAsNumber: true })} />
                      {errors.variants?.[index]?.price && <p className="mt-1 text-xs text-red-600">{errors.variants[index].price.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-600">Stock</label>
                      <input type="number" className={inputClass} placeholder="0" {...register(`variants.${index}.stock`, { valueAsNumber: true })} />
                      {errors.variants?.[index]?.stock && <p className="mt-1 text-xs text-red-600">{errors.variants[index].stock.message}</p>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-600">Variant Image URL (optional)</label>
                    <input type="url" className={inputClass} placeholder="https://example.com/variant-image.jpg" {...register(`variants.${index}.imageUrl`)} />
                    {errors.variants?.[index]?.imageUrl && <p className="mt-1 text-xs text-red-600">{errors.variants[index].imageUrl.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-4">
            <Link to="/products" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
