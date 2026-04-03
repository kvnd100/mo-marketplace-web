export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Variant {
  id: string;
  productId: string;
  color: string;
  size: string;
  material: string;
  combinationKey: string;
  price: number;
  stock: number;
  sku: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  category?: string;
  brand?: string;
  condition?: 'new' | 'used' | 'refurbished';
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  combinationKey: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  price: number;
  stock: number;
  quantity: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
