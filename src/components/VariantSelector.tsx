import { useMemo } from 'react';
import type { Variant } from '../types';

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
      return !variants.some(
        (v) => v[dimension] === value && v.stock > 0,
      );
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

  const renderGroup = (
    label: string,
    options: string[],
    selected: string | null,
    onSelect: (value: string) => void,
    dimension: 'color' | 'size' | 'material',
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const disabled = isOptionDisabled(dimension, option);
          const active = selected === option;

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option)}
              className={`relative rounded-lg border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-600'
                  : disabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 line-through'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {option}
              {disabled && (
                <span className="absolute -top-2 -right-2 rounded-full bg-gray-400 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Out
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const selectedVariant =
    selectedColor && selectedSize && selectedMaterial
      ? findVariant(selectedColor, selectedSize, selectedMaterial)
      : undefined;

  return (
    <div className="space-y-5">
      {renderGroup('Color', colors, selectedColor, onSelectColor, 'color')}
      {renderGroup('Size', sizes, selectedSize, onSelectSize, 'size')}
      {renderGroup('Material', materials, selectedMaterial, onSelectMaterial, 'material')}

      {selectedVariant && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected Variant</p>
              <p className="font-mono text-sm font-medium text-gray-900">
                {selectedVariant.combinationKey}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">
                ${Number(selectedVariant.price).toFixed(2)}
              </p>
              <p
                className={`text-sm font-medium ${
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
