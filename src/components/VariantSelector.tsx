import { useMemo } from 'react';
import type { Variant } from '../types';
import { getVariantColorHex } from '../utils/variantColors';

interface VariantSelectorProps {
  variants: Variant[];
  selectedColor: string | null;
  selectedSize: string | null;
  selectedMaterial: string | null;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: string) => void;
  onSelectMaterial: (material: string) => void;
}

export default function VariantSelector({
  variants,
  selectedColor,
  selectedSize,
  selectedMaterial,
  onSelectColor,
  onSelectSize,
  onSelectMaterial,
}: VariantSelectorProps) {
  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color))],
    [variants],
  );

  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size))],
    [variants],
  );

  const materials = useMemo(
    () => [...new Set(variants.map((v) => v.material))],
    [variants],
  );

  const findVariant = (
    color: string | null,
    size: string | null,
    material: string | null,
  ): Variant | undefined =>
    variants.find(
      (v) => v.color === color && v.size === size && v.material === material,
    );

  const isOptionDisabled = (
    dimension: 'color' | 'size' | 'material',
    value: string,
  ): boolean => {
    const testColor = dimension === 'color' ? value : selectedColor;
    const testSize = dimension === 'size' ? value : selectedSize;
    const testMaterial = dimension === 'material' ? value : selectedMaterial;

    if (
      (dimension === 'color' && !selectedSize && !selectedMaterial) ||
      (dimension === 'size' && !selectedColor && !selectedMaterial) ||
      (dimension === 'material' && !selectedColor && !selectedSize)
    ) {
      return !variants.some((v) => v[dimension] === value && v.stock > 0);
    }

    if (testColor && testSize && testMaterial) {
      const variant = findVariant(testColor, testSize, testMaterial);
      return !variant || variant.stock === 0;
    }

    return !variants.some(
      (v) =>
        (testColor ? v.color === testColor : true) &&
        (testSize ? v.size === testSize : true) &&
        (testMaterial ? v.material === testMaterial : true) &&
        v.stock > 0,
    );
  };

  const selectedVariant =
    selectedColor && selectedSize && selectedMaterial
      ? findVariant(selectedColor, selectedSize, selectedMaterial)
      : undefined;

  return (
    <div className="space-y-8">
      {/* Color */}
      <fieldset>
        <legend className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Color:{' '}
          {selectedColor && (
            <span className="text-on-surface">{selectedColor}</span>
          )}
        </legend>
        <div className="flex gap-3" role="radiogroup" aria-label="Color">
          {colors.map((color) => {
            const disabled = isOptionDisabled('color', color);
            const active = selectedColor === color;
            const onlyOption = colors.length === 1;
            const hex = getVariantColorHex(color);

            return (
              <button
                key={color}
                type="button"
                disabled={disabled || onlyOption}
                onClick={() => onSelectColor(color)}
                role="radio"
                aria-checked={active}
                aria-label={`${color}${disabled ? ' (out of stock)' : ''}`}
                className={`relative h-10 w-10 overflow-hidden rounded-full border-2 transition-all ${
                  onlyOption
                    ? 'border-zinc-200'
                    : active
                      ? 'border-primary'
                      : disabled
                        ? 'cursor-not-allowed border-zinc-100 opacity-40'
                        : 'border-transparent hover:border-zinc-300'
                }`}
              >
                <div
                  className={`h-full w-full rounded-full shadow-inner ${
                    hex ? '' : 'bg-zinc-300'
                  } ${hex === '#ffffff' ? 'border border-zinc-100' : ''}`}
                  style={hex ? { backgroundColor: hex } : undefined}
                />
                {disabled && !onlyOption && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-0.5 w-8 rotate-45 rounded bg-zinc-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset>
        <legend className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Size:{' '}
          {selectedSize && (
            <span className="text-on-surface">{selectedSize}</span>
          )}
        </legend>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Size">
          {sizes.map((size) => {
            const disabled = isOptionDisabled('size', size);
            const active = selectedSize === size;
            const onlyOption = sizes.length === 1;

            return (
              <button
                key={size}
                type="button"
                disabled={disabled || onlyOption}
                onClick={() => onSelectSize(size)}
                role="radio"
                aria-checked={active}
                aria-label={`${size}${disabled ? ' (out of stock)' : ''}`}
                className={`rounded-lg border px-6 py-2 text-sm font-semibold transition-colors ${
                  onlyOption
                    ? 'border-zinc-200 text-zinc-700'
                    : active
                      ? 'border-2 border-primary bg-primary-container/10 font-black text-primary'
                      : disabled
                        ? 'cursor-not-allowed border-zinc-100 text-zinc-300 line-through'
                        : 'border-zinc-200 text-zinc-700 hover:border-primary'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Material */}
      <fieldset>
        <legend className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Material:{' '}
          {selectedMaterial && (
            <span className="text-on-surface">{selectedMaterial}</span>
          )}
        </legend>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Material">
          {materials.map((material) => {
            const disabled = isOptionDisabled('material', material);
            const active = selectedMaterial === material;
            const onlyOption = materials.length === 1;

            return (
              <button
                key={material}
                type="button"
                disabled={disabled || onlyOption}
                onClick={() => onSelectMaterial(material)}
                role="radio"
                aria-checked={active}
                aria-label={`${material}${disabled ? ' (out of stock)' : ''}`}
                className={`rounded px-5 py-2 text-sm font-semibold transition-colors ${
                  onlyOption
                    ? 'bg-surface-container-low text-zinc-600'
                    : active
                      ? 'border border-primary bg-surface-container-high font-bold text-primary'
                      : disabled
                        ? 'cursor-not-allowed bg-zinc-50 text-zinc-300 line-through'
                        : 'bg-surface-container-low text-zinc-600 hover:bg-surface-container-high'
                }`}
              >
                {material}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div
          className={`rounded-xl border p-5 ${
            selectedVariant.stock === 0
              ? 'border-red-200 bg-red-50'
              : 'border-zinc-200 bg-surface-container-low'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Selected Variant
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-on-surface">
                {selectedVariant.combinationKey}
              </p>
            </div>
            <div className="text-right">
              <p className="font-headline text-2xl font-bold text-primary">
                ${Number(selectedVariant.price).toFixed(2)}
              </p>
              <p
                className={`text-xs font-bold uppercase tracking-widest ${
                  selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {selectedVariant.stock > 0
                  ? `${selectedVariant.stock} in stock`
                  : 'Out of stock'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
