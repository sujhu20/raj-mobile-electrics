import type { Role, OrderStatus } from '../config/constants';

// ============================================================================
// API Response Wrappers
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// User
// ============================================================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isVerified: boolean;
  isBlocked?: boolean;
  provider?: string;
  lastLoginAt?: string;
  createdAt?: string;
  _count?: { orders: number; reviews: number };
}

// ============================================================================
// Product
// ============================================================================
export interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  model?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  isFeatured: boolean;
  isActive: boolean;
  weight?: number;
  specifications?: Record<string, string>;
  tags?: string[];
  totalSold: number;
  avgRating: number;
  totalReviews: number;
  categoryId: string;
  category?: CategoryBrief;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBrief {
  id: string;
  name: string;
  slug: string;
}

// ============================================================================
// Category
// ============================================================================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: CategoryBrief;
  _count?: { products: number };
  createdAt: string;
}

// ============================================================================
// Order
// ============================================================================
export interface OrderItem {
  id: string;
  productId: string;
  product?: { name: string; slug: string; images?: ProductImage[] };
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  shippingAddress?: Record<string, string>;
  payment?: {
    method: string;
    status: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Review
// ============================================================================
export interface Review {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  productId: string;
  product?: Pick<Product, 'id' | 'name' | 'slug'>;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

// ============================================================================
// Coupon
// ============================================================================
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// Banner
// ============================================================================
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// ============================================================================
// Dashboard Analytics
// ============================================================================
export interface DashboardStats {
  revenue: { total: number; monthly: number; growth: number };
  orders: { total: number; monthly: number; pending: number };
  products: { total: number; lowStock: number };
  users: { total: number };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  totalSold: number;
  images?: ProductImage[];
}
