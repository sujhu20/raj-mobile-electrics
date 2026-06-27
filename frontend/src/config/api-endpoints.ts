/**
 * Centralized API endpoint paths.
 * All admin pages import from here instead of hardcoding paths.
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  USERS: {
    ME: '/users/me',
    ADMIN_LIST: '/users/admin/users',
    ADMIN_DETAIL: (id: string) => `/users/admin/users/${id}`,
    ADMIN_BLOCK: (id: string) => `/users/admin/users/${id}/block`,
    ADMIN_ROLE: (id: string) => `/users/admin/users/${id}/role`,
  },

  PRODUCTS: {
    LIST: '/products',
    FEATURED: '/products/featured',
    LATEST: '/products/latest',
    TOP_SELLING: '/products/top-selling',
    BY_SLUG: (slug: string) => `/products/${slug}`,
    SIMILAR: (id: string) => `/products/${id}/similar`,
    ADMIN_CREATE: '/products/admin',
    ADMIN_DETAIL: (id: string) => `/products/admin/${id}`,
    ADMIN_UPDATE: (id: string) => `/products/admin/${id}`,
    ADMIN_DELETE: (id: string) => `/products/admin/${id}`,
    ADMIN_IMAGES: (id: string) => `/products/admin/${id}/images`,
    ADMIN_DELETE_IMAGE: (id: string, imageId: string) => `/products/admin/${id}/images/${imageId}`,
  },

  CATEGORIES: {
    LIST: '/categories',
    ADMIN_CREATE: '/categories/admin',
    ADMIN_UPDATE: (id: string) => `/categories/admin/${id}`,
    ADMIN_DELETE: (id: string) => `/categories/admin/${id}`,
  },

  ORDERS: {
    MY_ORDERS: '/orders',
    MY_ORDER_DETAIL: (id: string) => `/orders/${id}`,
    ADMIN_LIST: '/orders/admin/all',
    ADMIN_DETAIL: (id: string) => `/orders/admin/${id}`,
    ADMIN_STATUS: (id: string) => `/orders/admin/${id}/status`,
  },

  REVIEWS: {
    BY_PRODUCT: (productId: string) => `/reviews/product/${productId}`,
    CREATE: '/reviews',
    ADMIN_LIST: '/reviews/admin/all',
    ADMIN_APPROVE: (id: string) => `/reviews/admin/${id}/approve`,
    ADMIN_DELETE: (id: string) => `/reviews/admin/${id}`,
  },

  COUPONS: {
    VALIDATE: '/coupons/validate',
    ADMIN_LIST: '/coupons/admin',
    ADMIN_CREATE: '/coupons/admin',
    ADMIN_UPDATE: (id: string) => `/coupons/admin/${id}`,
    ADMIN_DELETE: (id: string) => `/coupons/admin/${id}`,
  },

  BANNERS: {
    PUBLIC: '/banners',
    ADMIN_LIST: '/banners/admin',
    ADMIN_CREATE: '/banners/admin',
    ADMIN_UPDATE: (id: string) => `/banners/admin/${id}`,
    ADMIN_DELETE: (id: string) => `/banners/admin/${id}`,
  },

  ANALYTICS: {
    DASHBOARD: '/admin/analytics/dashboard',
    REVENUE: '/admin/analytics/revenue',
    TOP_PRODUCTS: '/admin/analytics/top-products',
    SALES: '/admin/analytics/sales',
    REPORTS: '/admin/analytics/reports',
  },

  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: '/cart/clear',
  },

  WISHLIST: {
    GET: '/wishlist',
    TOGGLE: (productId: string) => `/wishlist/${productId}`,
  },

  SEARCH: {
    QUERY: '/search',
  },
} as const;
