// ============================================================================
// App
// ============================================================================
export const APP_NAME = 'Raj Mobile & Electrics';
export const APP_DESCRIPTION = 'Your Trusted Raj Mobile & Electronics Store';
export const CURRENCY = 'Rs.';
export const TAX_RATE = 13;

// ============================================================================
// Roles
// ============================================================================
export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ============================================================================
// Permissions (frontend-only; ADMIN gets all)
// ============================================================================
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  ORDERS_READ: 'orders.read',
  ORDERS_MANAGE: 'orders.manage',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_WRITE: 'categories.write',
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',
  REVIEWS_READ: 'reviews.read',
  REVIEWS_MANAGE: 'reviews.manage',
  COUPONS_READ: 'coupons.read',
  COUPONS_WRITE: 'coupons.write',
  BANNERS_READ: 'banners.read',
  BANNERS_WRITE: 'banners.write',
  ANALYTICS_VIEW: 'analytics.view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// ============================================================================
// Storage Keys
// ============================================================================
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  SIDEBAR_COLLAPSED: 'admin_sidebar_collapsed',
} as const;

// ============================================================================
// Routes
// ============================================================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  SEARCH: '/search',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  PROFILE: '/profile',
  PAYMENT_CALLBACK: '/payment/:gateway/callback',

  // Admin
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/:id/edit',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:id',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_USERS: '/admin/users',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

// ============================================================================
// Brands
// ============================================================================
export const BRANDS = [
  'Samsung', 'Apple', 'Xiaomi', 'OnePlus', 'Realme', 'Vivo', 'Oppo',
  'Google', 'Nothing', 'Poco', 'Motorola', 'Nokia', 'Sony',
  'JBL', 'Bose', 'Anker', 'Canon', 'Nikon', 'GoPro',
  'Amazfit', 'Garmin', 'Boat', 'Baseus', 'Belkin', 'Ugreen',
];

// ============================================================================
// Category Icons
// ============================================================================
export const CATEGORY_ICONS: Record<string, string> = {
  smartphones: '📱',
  tablets: '📟',
  'smart-watches': '⌚',
  earbuds: '🎧',
  headphones: '🎧',
  chargers: '🔌',
  'power-banks': '🔋',
  'cases-covers': '🧳',
  cameras: '📷',
  'camera-accessories': '📸',
  speakers: '🔊',
  'gaming-accessories': '🎮',
  'laptop-accessories': '💻',
  'feature-phones': '📞',
  'electrical-items': '💡',
  cables: '🪢',
  'other-electronics': '🔧',
};

// ============================================================================
// Order Status
// ============================================================================
export const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// ============================================================================
// Payment Methods
// ============================================================================
export const PAYMENT_METHODS = [
  { id: 'STRIPE', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'ESEWA', name: 'eSewa', icon: '🟢' },
  { id: 'KHALTI', name: 'Khalti', icon: '🟣' },
  { id: 'COD', name: 'Cash on Delivery', icon: '💵' },
];
