import { Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { LoadingBlock } from '@/shared/ui';
import { useAuthStore } from '@/store/auth.store';
import { lazyPage } from './lazy-page';
import { LoginPage } from '@/features/auth/LoginPage';

/**
 * ⚠️ Sahifalar LAZY yuklanadi. Xarita (Leaflet) va diagrammalar
 * (Recharts) birgalikda ~400 KB: ularni bosh sahifa bilan birga
 * yuklash birinchi ochilishni sezilarli sekinlashtirardi.
 */
const DashboardPage = lazyPage(() => import('@/features/dashboard/DashboardPage'));
const ObjectsPage = lazyPage(() => import('@/features/objects/ObjectsPage'));
const ObjectDetailPage = lazyPage(() => import('@/features/objects/ObjectDetailPage'));
const MapPage = lazyPage(() => import('@/features/map/MapPage'));
const DistrictsPage = lazyPage(() => import('@/features/districts/DistrictsPage'));
const CalendarPage = lazyPage(() => import('@/features/calendar/CalendarPage'));
const DelaysPage = lazyPage(() => import('@/features/delays/DelaysPage'));
const ReportsPage = lazyPage(() => import('@/features/reports/ReportsPage'));
const PhotosPage = lazyPage(() => import('@/features/photos/PhotosPage'));
const DocumentsPage = lazyPage(() => import('@/features/documents/DocumentsPage'));
const ResponsiblesPage = lazyPage(() => import('@/features/responsibles/ResponsiblesPage'));
const ContractorsPage = lazyPage(() => import('@/features/contractors/ContractorsPage'));
const ContractorDetailPage = lazyPage(() => import('@/features/contractors/ContractorDetailPage'));
const FundingPage = lazyPage(() => import('@/features/funding/FundingPage'));
const AiPage = lazyPage(() => import('@/features/ai/AiPage'));
const SettingsPage = lazyPage(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazyPage(() => import('@/features/misc/NotFoundPage'));

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  // ⚠️ Sessiya tekshirilayotganda login'ga YO‘NALTIRILMAYDI: aks holda
  // sahifani yangilagan foydalanuvchi har safar login ekranini ko‘rib,
  // keyin orqaga qaytarilardi.
  if (isBootstrapping) return <LoadingBlock className="min-h-screen" label="Sessiya tekshirilmoqda…" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Suspense fallback={<LoadingBlock className="min-h-[60vh]" />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}

function PublicOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  if (isBootstrapping) return <LoadingBlock className="min-h-screen" label="Yuklanmoqda…" />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/objects', element: <ObjectsPage /> },
      { path: '/objects/:id', element: <ObjectDetailPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/districts', element: <DistrictsPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/delays', element: <DelaysPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/photos', element: <PhotosPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/responsibles', element: <ResponsiblesPage /> },
      { path: '/contractors', element: <ContractorsPage /> },
      { path: '/contractors/:id', element: <ContractorDetailPage /> },
      { path: '/funding', element: <FundingPage /> },
      { path: '/ai', element: <AiPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
