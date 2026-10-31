import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { LoadingBlock } from '@/shared/ui';
import { useAuthStore } from '@/store/auth.store';
import { LoginPage } from '@/features/auth/LoginPage';

/**
 * ⚠️ Sahifalar LAZY yuklanadi. Xarita (Leaflet) va diagrammalar
 * (Recharts) birgalikda ~400 KB: ularni bosh sahifa bilan birga
 * yuklash birinchi ochilishni sezilarli sekinlashtirardi.
 */
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ObjectsPage = lazy(() => import('@/features/objects/ObjectsPage'));
const ObjectDetailPage = lazy(() => import('@/features/objects/ObjectDetailPage'));
const MapPage = lazy(() => import('@/features/map/MapPage'));
const DistrictsPage = lazy(() => import('@/features/districts/DistrictsPage'));
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
const DelaysPage = lazy(() => import('@/features/delays/DelaysPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const PhotosPage = lazy(() => import('@/features/photos/PhotosPage'));
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'));
const ResponsiblesPage = lazy(() => import('@/features/responsibles/ResponsiblesPage'));
const ContractorsPage = lazy(() => import('@/features/contractors/ContractorsPage'));
const ContractorDetailPage = lazy(() => import('@/features/contractors/ContractorDetailPage'));
const FundingPage = lazy(() => import('@/features/funding/FundingPage'));
const AiPage = lazy(() => import('@/features/ai/AiPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/features/misc/NotFoundPage'));

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
