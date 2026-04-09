/* eslint-disable react-refresh/only-export-components */
import '@/index.css'
import { enableMapSet } from 'immer';
import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { finishTelemetryTimer, recordTelemetryEvent, reportColdStart, startTelemetryTimer } from '@/lib/telemetry';
import { HomePage } from '@/pages/HomePage';

enableMapSet();

const queryClient = new QueryClient();

const loadNavigationHub = () => import('@/pages/NavigationHub');
const loadSettingsPage = () => import('@/pages/SettingsPage');
const loadMediaPage = () => import('@/pages/MediaPage');
const loadAppsPage = () => import('@/pages/AppsPage');
const loadTrackingPage = () => import('@/pages/TrackingPage');
const loadTripsPage = () => import('./pages/TripsPage');
const loadThemeStorePage = () => import('@/pages/ThemeStorePage');

const NavigationHub = lazy(() => loadNavigationHub().then((module) => ({ default: module.NavigationHub })));
const SettingsPage = lazy(() => loadSettingsPage().then((module) => ({ default: module.SettingsPage })));
const MediaPage = lazy(() => loadMediaPage().then((module) => ({ default: module.MediaPage })));
const AppsPage = lazy(() => loadAppsPage().then((module) => ({ default: module.AppsPage })));
const TrackingPage = lazy(() => loadTrackingPage().then((module) => ({ default: module.TrackingPage })));
const TripsPage = lazy(loadTripsPage);
const ThemeStorePage = lazy(() => loadThemeStorePage().then((module) => ({ default: module.ThemeStorePage })));

const routeLoaderFallback = (
  <div aria-hidden="true" className="min-h-screen bg-black" />
);

function warmRouteModules() {
  void Promise.allSettled([
    loadNavigationHub(),
    loadSettingsPage(),
    loadMediaPage(),
    loadAppsPage(),
    loadTrackingPage(),
    loadTripsPage(),
    loadThemeStorePage(),
  ]);
}

let lastRouteTelemetry: { routeId: string; timestamp: number } | null = null;

function RouteTelemetryBoundary({ routeId, children }: { routeId: string; children: React.ReactElement }) {
  useEffect(() => {
    const now = Date.now();
    if (lastRouteTelemetry?.routeId === routeId && now - lastRouteTelemetry.timestamp < 500) {
      return;
    }

    lastRouteTelemetry = { routeId, timestamp: now };
    const timerKey = `screen:${routeId}`;
    let timeoutId: number | undefined;

    startTelemetryTimer(timerKey);
    recordTelemetryEvent({
      type: 'route-change',
      level: 'info',
      message: `Opened ${routeId} screen.`,
      route: routeId,
    });

    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        finishTelemetryTimer(timerKey, {
          message: `Screen ready: ${routeId}`,
          route: routeId,
          metadata: { route: routeId },
          slowThresholdMs: 1400,
        });
      }, 0);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [routeId]);

  return <Suspense fallback={routeLoaderFallback}>{children}</Suspense>;
}

function withRouteLoader(routeId: string, element: React.ReactElement) {
  return <RouteTelemetryBoundary routeId={routeId}>{element}</RouteTelemetryBoundary>;
}

reportColdStart(typeof window !== 'undefined' ? window.location.pathname : '/');

if (typeof window !== 'undefined') {
  const scheduleRouteWarmup = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => warmRouteModules(), { timeout: 1500 });
      return;
    }

    window.setTimeout(warmRouteModules, 800);
  };

  if (document.readyState === 'complete') {
    scheduleRouteWarmup();
  } else {
    window.addEventListener('load', scheduleRouteWarmup, { once: true });
  }
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const serviceWorkerUrl = new URL('./sw.ts', import.meta.url);
  const registerServiceWorker = () => {
    navigator.serviceWorker
      .register(serviceWorkerUrl, { type: 'module' })
      .catch((error) => console.error('SW registration failed', error));
  };

  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => registerServiceWorker(), { timeout: 2000 });
      return;
    }

    window.setTimeout(registerServiceWorker, 1200);
  });
}
const router = createBrowserRouter([
  {
    path: "/",
    element: withRouteLoader('/', <HomePage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/navigation",
    element: withRouteLoader('/navigation', <NavigationHub />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: withRouteLoader('/settings', <SettingsPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/media",
    element: withRouteLoader('/media', <MediaPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/apps",
    element: withRouteLoader('/apps', <AppsPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/track/:id",
    element: withRouteLoader('/track/:id', <TrackingPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/trips",
    element: withRouteLoader('/trips', <TripsPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/theme-store",
    element: withRouteLoader('/theme-store', <ThemeStorePage />),
    errorElement: <RouteErrorBoundary />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
