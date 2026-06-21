import { lazy, type ComponentType } from 'react';

const loadLogin = () => import('../pages/auth/Login').then(module => ({ default: module.Login }));
const loadDashboardPage = () => import('../pages/Dashboard/DashboardPage').then(module => ({ default: module.DashboardPage }));
const loadPlatPage = () => import('../pages/Menu/PlatPage').then(module => ({ default: module.PlatPage }));
const loadCategoryPage = () => import('../pages/Categories/CategoryPage').then(module => ({ default: module.CategoryPage }));
const loadSallePage = () => import('../pages/Staff/SallePage').then(module => ({ default: module.SallePage }));
const loadOrderingPage = () => import('../pages/Staff/OrderingPage').then(module => ({ default: module.OrderingPage }));
const loadKdsPage = () => import('../pages/Staff/KdsPage').then(module => ({ default: module.KdsPage }));
const loadReservationsPage = () => import('../pages/Staff/ReservationsPage').then(module => ({ default: module.ReservationsPage }));
const loadStockPage = () => import('../pages/Inventory/StockPage').then(module => ({ default: module.StockPage }));
const loadHrPage = () => import('../pages/HR/HrPage').then(module => ({ default: module.HrPage }));
const loadAvisPage = () => import('../pages/Avis/AvisPage').then(module => ({ default: module.AvisPage }));
const loadLoyaltyPage = () => import('../pages/Loyalty/LoyaltyPage').then(module => ({ default: module.LoyaltyPage }));
const loadSettingsPage = () => import('../pages/Settings/SettingsPage').then(module => ({ default: module.SettingsPage }));
const loadMaintenancePage = () => import('../pages/System/MaintenancePage').then(module => ({ default: module.MaintenancePage }));

export const Login = lazy(loadLogin);
export const DashboardPage = lazy(loadDashboardPage);
export const PlatPage = lazy(loadPlatPage);
export const CategoryPage = lazy(loadCategoryPage);
export const SallePage = lazy(loadSallePage);
export const OrderingPage = lazy(loadOrderingPage);
export const KdsPage = lazy(loadKdsPage);
export const ReservationsPage = lazy(loadReservationsPage);
export const StockPage = lazy(loadStockPage);
export const HrPage = lazy(loadHrPage);
export const AvisPage = lazy(loadAvisPage);
export const LoyaltyPage = lazy(loadLoyaltyPage);
export const SettingsPage = lazy(loadSettingsPage);
export const MaintenancePage = lazy(loadMaintenancePage);

export const staffPagePreloads: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  '/login': loadLogin,
  '/': loadDashboardPage,
  '/menu': loadPlatPage,
  '/categories': loadCategoryPage,
  '/salle': loadSallePage,
  '/reservations': loadReservationsPage,
  '/kds': loadKdsPage,
  '/stock': loadStockPage,
  '/hr': loadHrPage,
  '/avis': loadAvisPage,
  '/loyalty': loadLoyaltyPage,
  '/settings': loadSettingsPage,
  '/maintenance': loadMaintenancePage,
};

export const preloadOrderingPage = loadOrderingPage;
