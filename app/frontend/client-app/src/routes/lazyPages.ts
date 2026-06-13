import { lazy, type ComponentType } from 'react';

const loadPortalHomePage = () => import('../pages/Home/PortalHomePage').then(module => ({ default: module.PortalHomePage }));
const loadMenuPage = () => import('../pages/Menu/MenuPage').then(module => ({ default: module.MenuPage }));
const loadReservationWizard = () => import('../pages/Reservations/ReservationWizard').then(module => ({ default: module.ReservationWizard }));
const loadLoyaltyPage = () => import('../pages/Loyalty/LoyaltyPage').then(module => ({ default: module.LoyaltyPage }));
const loadAccountPage = () => import('../pages/Account/AccountPage').then(module => ({ default: module.AccountPage }));
const loadLogin = () => import('../pages/auth/Login').then(module => ({ default: module.Login }));
const loadRegister = () => import('../pages/auth/Register').then(module => ({ default: module.Register }));
const loadForgotPassword = () => import('../pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword }));
const loadResetPassword = () => import('../pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword }));
const loadCheckoutPage = () => import('../pages/Checkout/CheckoutPage').then(module => ({ default: module.CheckoutPage }));
const loadContactPage = () => import('../pages/Contact/ContactPage').then(module => ({ default: module.ContactPage }));
const loadPaymentPortal = () => import('../pages/Payment/PaymentPortal').then(module => ({ default: module.PaymentPortal }));
const loadOfflineModePage = () => import('../pages/System/OfflineModePage').then(module => ({ default: module.OfflineModePage }));
const loadNotFoundPage = () => import('../pages/System/NotFoundPage').then(module => ({ default: module.NotFoundPage }));

export const PortalHomePage = lazy(loadPortalHomePage);
export const MenuPage = lazy(loadMenuPage);
export const ReservationWizard = lazy(loadReservationWizard);
export const LoyaltyPage = lazy(loadLoyaltyPage);
export const AccountPage = lazy(loadAccountPage);
export const Login = lazy(loadLogin);
export const Register = lazy(loadRegister);
export const ForgotPassword = lazy(loadForgotPassword);
export const ResetPassword = lazy(loadResetPassword);
export const CheckoutPage = lazy(loadCheckoutPage);
export const ContactPage = lazy(loadContactPage);
export const PaymentPortal = lazy(loadPaymentPortal);
export const OfflineModePage = lazy(loadOfflineModePage);
export const NotFoundPage = lazy(loadNotFoundPage);

export const publicPagePreloads: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  '/': loadPortalHomePage,
  '/menu': loadMenuPage,
  '/reservations': loadReservationWizard,
  '/loyalty': loadLoyaltyPage,
  '/account': loadAccountPage,
  '/login': loadLogin,
  '/register': loadRegister,
  '/forgot-password': loadForgotPassword,
  '/reset-password': loadResetPassword,
  '/checkout': loadCheckoutPage,
  '/contact': loadContactPage,
  '/offline': loadOfflineModePage,
};
