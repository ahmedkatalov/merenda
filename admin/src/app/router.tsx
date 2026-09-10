import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from './AppShell';
import { PageFallback } from './PageFallback';
import { RouteError } from './RouteError';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const MenusPage = lazy(() => import('@/features/menus/pages/MenusPage'));
const CategoriesPage = lazy(() => import('@/features/categories/pages/CategoriesPage'));
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'));
const ProductEditorPage = lazy(() => import('@/features/products/pages/ProductEditorPage'));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const HoursPage = lazy(() => import('@/features/hours/pages/HoursPage'));
const AppearancePage = lazy(() => import('@/features/appearance/pages/AppearancePage'));
const BuilderPage = lazy(() => import('@/features/builder/pages/BuilderPage'));
const MediaPage = lazy(() => import('@/features/media/pages/MediaPage'));
const WhatsappPage = lazy(() => import('@/features/whatsapp/pages/WhatsappPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const SecurityPage = lazy(() => import('@/features/security/pages/SecurityPage'));

const page = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

export const router = createBrowserRouter([
  { path: '/login', element: page(<LoginPage />), errorElement: <RouteError /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(<DashboardPage />) },
      { path: 'menus', element: page(<MenusPage />) },
      { path: 'categories', element: page(<CategoriesPage />) },
      { path: 'products', element: page(<ProductsPage />) },
      { path: 'products/new', element: page(<ProductEditorPage />) },
      { path: 'products/:id', element: page(<ProductEditorPage />) },
      { path: 'orders', element: page(<OrdersPage />) },
      { path: 'orders/:id', element: page(<OrderDetailPage />) },
      { path: 'hours', element: page(<HoursPage />) },
      { path: 'appearance', element: page(<AppearancePage />) },
      { path: 'builder', element: page(<BuilderPage />) },
      { path: 'media', element: page(<MediaPage />) },
      { path: 'whatsapp', element: page(<WhatsappPage />) },
      { path: 'settings', element: page(<SettingsPage />) },
      { path: 'security', element: page(<SecurityPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
