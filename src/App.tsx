import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { UserSettingsProvider } from '@/context/UserSettingsContext';
import { AppProvider } from '@/context/AppContext';
import { SessionProvider } from '@/context/SessionContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { BottomNav } from '@/shared/components/BottomNav';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useServiceWorker } from '@/services/pwa/useServiceWorker';
import { InstallPrompt } from '@/shared/components/InstallPrompt';
import { SyncIndicator } from '@/shared/components/SyncIndicator';
import { useInstallPrompt } from '@/services/pwa/useInstallPrompt';

const isNative = Capacitor.isNativePlatform();

const Home = lazy(() => import('@/routes/Home'));
const AssessmentRoute = lazy(() => import('@/routes/AssessmentRoute'));
const TrainingRoute = lazy(() => import('@/routes/TrainingRoute'));
const ProgressRoute = lazy(() => import('@/routes/ProgressRoute'));
const ProfileRoute = lazy(() => import('@/routes/ProfileRoute'));
const CognitionRoute = lazy(() => import('@/routes/CognitionRoute'));
const ResearchRoute = lazy(() => import('@/routes/ResearchRoute'));

/**
 * App - Main application component
 * Wraps the app with Context providers in correct order:
 * UserSettingsProvider -> AppProvider -> SessionProvider -> Routes
 *
 * This order ensures:
 * 1. User settings load first (needed by other contexts)
 * 2. App-level state initializes next
 * 3. Session state initializes last
 * 4. Routes are rendered with full context access
 */
function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}

function AppContent() {
  const { shouldShowPrompt } = useInstallPrompt();

  useEffect(() => {
    if (!isNative) return;
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, []);

  return (
    <div
      className="min-h-screen bg-background pb-20"
      style={shouldShowPrompt ? { paddingBottom: '280px' } : undefined}
    >
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="large" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<AssessmentRoute />} />
          <Route path="/training" element={<TrainingRoute />} />
          <Route path="/cognition" element={<CognitionRoute />} />
          <Route path="/progress" element={<ProgressRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
          <Route path="/research" element={<ResearchRoute />} />
        </Routes>
      </Suspense>
      <BottomNav />
      {!isNative && <InstallPrompt />}
      {!isNative && <SyncIndicator />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ServiceWorkerRegistration />
      <UserSettingsProvider>
        <AppProvider>
          <SessionProvider>
            <AppContent />
          </SessionProvider>
        </AppProvider>
      </UserSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
