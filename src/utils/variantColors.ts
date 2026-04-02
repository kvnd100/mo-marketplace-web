export const VARIANT_COLOR_MAP: Record<string, string> = {
  white: '#ffffff',
  black: '#1f1f1f',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#9333ea',
  orange: '#f97316',
  gray: '#9ca3af',
  grey: '#9ca3af',
  silver: '#c0c0c0',
  brown: '#92400e',
  navy: '#1e3a5f',
  beige: '#d4c5a9',
};

export function getVariantColorHex(colorName: string): string | null {
  return VARIANT_COLOR_MAP[colorName.toLowerCase()] ?? null;
}
