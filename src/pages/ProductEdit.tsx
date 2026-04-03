import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import client from '../api/client';
import type { Product, ApiError, Category } from '../types';
import Icon from '../components/Icon';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
] as const;

const variantSchema = z.object({
  id: z.string().optional(),
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
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'used', 'refurbished']),
  images: z.array(z.string().url('Must be a valid URL')).min(0),
  variants: z.array(variantSchema),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      category: '',
      condition: 'new',
      images: [],
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  useEffect(() => {
    client
      .get<Product>(`/products/${id}`)
      .then((res) => {
        const p = res.data;
        const imgs = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : [];
        setImageInputs(imgs.length > 0 ? imgs : ['']);
        reset({
          name: p.name,
          description: p.description,
          basePrice: Number(p.basePrice),
          category: p.category || '',
          condition: p.condition || 'new',
          images: imgs,
          variants: p.variants.map((v) => ({
            id: v.id,
            color: v.color,
            size: v.size,
            material: v.material,
            price: Number(v.price),
            stock: v.stock,
            imageUrl: v.imageUrl || '',
          })),
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setApiError('Failed to load product.');
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  const handleImageChange = (index: number, value: string) => {
    const updated = [...imageInputs];
    updated[index] = value;
    setImageInputs(updated);
    setValue(
      'images',
      updated.filter((url) => url.trim() !== ''),
      { shouldDirty: true },
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
      { shouldDirty: true },
    );
  };

  const handleRemoveVariant = (index: number) => {
    const variant = fields[index];
    if (variant && 'id' in variant && typeof (variant as { id?: string }).id === 'string') {
      const vid = (variant as { id: string }).id;
      if (vid) setDeletedVariantIds((prev) => [...prev, vid]);
    }
    remove(index);
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    setApiError(null);
    setVariantErrors({});
    setSubmitting(true);

    try {
      await client.patch(`/products/${id}`, {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        imageUrl: data.images[0] || null,
        images: data.images,
        category: data.category,
        condition: data.condition,
      });

      for (const vid of deletedVariantIds) {
        try {
          await client.delete(`/products/${id}/variants/${vid}`);
        } catch {
          // variant may already be deleted
        }
      }

      const variantErrs: Record<number, string> = {};
      for (let i = 0; i < data.variants.length; i++) {
        const variant = data.variants[i];
        try {
          if (variant.id) {
            await client.patch(`/products/${id}/variants/${variant.id}`, {
              color: variant.color,
              size: variant.size,
              material: variant.material,
              price: variant.price,
              stock: variant.stock,
              imageUrl: variant.imageUrl || null,
            });
          } else {
            await client.post(`/products/${id}/variants`, {
              color: variant.color,
              size: variant.size,
              material: variant.material,
              price: variant.price,
              stock: variant.stock,
              imageUrl: variant.imageUrl || null,
            });
          }
        } catch (err) {
          if (err instanceof AxiosError && err.response?.data) {
            const body = err.response.data as ApiError;
            variantErrs[i] = Array.isArray(body.message) ? body.message.join(', ') : body.message;
          } else {
            variantErrs[i] = 'Failed to save this variant.';
          }
        }
      }

      if (Object.keys(variantErrs).length > 0) {
        setVariantErrors(variantErrs);
        setApiError(`Product updated, but ${Object.keys(variantErrs).length} variant(s) had errors.`);
      } else {
        navigate(`/products/${id}`);
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const body = err.response.data as ApiError;
        setApiError(Array.isArray(body.message) ? body.message.join(', ') : body.message);
      } else {
        setApiError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await client.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const body = err.response.data as ApiError;
        setApiError(Array.isArray(body.message) ? body.message.join(', ') : body.message);
      } else {
        setApiError('Failed to delete product.');
      }
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-on-surface placeholder-zinc-400 transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  const selectClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-on-surface transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-16">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
            <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-96 animate-pulse rounded-xl bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-16">
        <div className="py-20 text-center">
          <Icon name="sentiment_dissatisfied" className="mx-auto text-6xl text-zinc-300" />
          <h1 className="mt-6 font-headline text-3xl font-bold text-on-surface">Product Not Found</h1>
          <Link to="/products" className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-container">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-16">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <Link to="/products" className="hover:text-primary hover:underline">Products</Link>
              <Icon name="chevron_right" className="text-xs text-zinc-300" />
              <Link to={`/products/${id}`} className="hover:text-primary hover:underline">Product</Link>
              <Icon name="chevron_right" className="text-xs text-zinc-300" />
              <span className="text-zinc-400">Edit</span>
            </nav>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Edit Product</h1>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
          >
            <Icon name="delete" className="text-sm" />
            Delete
          </button>
        </div>

        {apiError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
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
                  <input id="name" className={inputClass} placeholder="Product name" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="basePrice" className="mb-1.5 block text-xs font-medium text-zinc-600">Base Price ($)</label>
                  <input id="basePrice" type="number" step="0.01" className={inputClass} placeholder="0.00" {...register('basePrice', { valueAsNumber: true })} />
                  {errors.basePrice && <p className="mt-1 text-xs text-red-600">{errors.basePrice.message}</p>}
                </div>
                <div>
                  <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-zinc-600">Category</label>
                  <select id="category" className={selectClass} {...register('category')} aria-invalid={errors.category ? 'true' : 'false'}>
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                </div>
                <div>
                  <label htmlFor="condition" className="mb-1.5 block text-xs font-medium text-zinc-600">Condition</label>
                  <select id="condition" className={selectClass} {...register('condition')} aria-invalid={errors.condition ? 'true' : 'false'}>
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.condition && <p className="mt-1 text-xs text-red-600">{errors.condition.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-zinc-600">Description</label>
                <textarea id="description" rows={4} className={inputClass} placeholder="Describe your product..." {...register('description')} />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
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
                <div className="py-12 text-center">
                  <Icon name="inventory_2" className="mx-auto text-4xl text-zinc-300" />
                  <p className="mt-2 text-sm text-zinc-500">No variants yet. Add one to get started.</p>
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className={`p-6 ${variantErrors[index] ? 'bg-red-50/50' : ''}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold text-zinc-600">
                        {index + 1}
                      </span>
                      {(field as { id?: string }).id ? 'Existing Variant' : 'New Variant'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
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
            <Link to={`/products/${id}`} className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700">
              Cancel
            </Link>
            <div className="flex items-center gap-3">
              {isDirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Icon name="delete" className="text-2xl text-red-600" />
            </div>
            <h3 className="text-center text-lg font-bold text-on-surface">Delete Product</h3>
            <p className="mt-2 text-center text-sm text-zinc-500">
              This will permanently delete this product and all its variants. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
