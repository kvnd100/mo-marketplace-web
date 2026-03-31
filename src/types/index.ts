export interface User {
  id: string;
  email: string;
  createdAt: string;
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
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
