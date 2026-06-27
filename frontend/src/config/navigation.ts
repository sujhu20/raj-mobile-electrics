import {
  FiGrid, FiShoppingBag, FiPackage, FiLayers, FiUsers,
  FiStar, FiTag, FiImage, FiBarChart2,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { ROUTES, PERMISSIONS } from './constants';
import type { Permission } from './constants';

export interface AdminNavItem {
  title: string;
  path: string;
  icon: IconType;
  permission: Permission;
}

export const adminNavigation: AdminNavItem[] = [
  { title: 'Dashboard',  path: ROUTES.ADMIN_DASHBOARD,  icon: FiGrid,        permission: PERMISSIONS.DASHBOARD_VIEW },
  { title: 'Products',   path: ROUTES.ADMIN_PRODUCTS,    icon: FiShoppingBag, permission: PERMISSIONS.PRODUCTS_READ },
  { title: 'Orders',     path: ROUTES.ADMIN_ORDERS,      icon: FiPackage,     permission: PERMISSIONS.ORDERS_READ },
  { title: 'Categories', path: ROUTES.ADMIN_CATEGORIES,  icon: FiLayers,      permission: PERMISSIONS.CATEGORIES_READ },
  { title: 'Users',      path: ROUTES.ADMIN_USERS,       icon: FiUsers,       permission: PERMISSIONS.USERS_READ },
  { title: 'Reviews',    path: ROUTES.ADMIN_REVIEWS,     icon: FiStar,        permission: PERMISSIONS.REVIEWS_READ },
  { title: 'Coupons',    path: ROUTES.ADMIN_COUPONS,     icon: FiTag,         permission: PERMISSIONS.COUPONS_READ },
  { title: 'Banners',    path: ROUTES.ADMIN_BANNERS,     icon: FiImage,       permission: PERMISSIONS.BANNERS_READ },
  { title: 'Analytics',  path: ROUTES.ADMIN_ANALYTICS,   icon: FiBarChart2,   permission: PERMISSIONS.ANALYTICS_VIEW },
];
