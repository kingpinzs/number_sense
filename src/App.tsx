import { Routes, Route } from 'react-router-dom';
import { UserSettingsProvider } from '@/context/UserSettingsContext';
import { AppProvider } from '@/context/AppContext';
import { SessionProvider } from '@/context/SessionContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { BottomNav } from '@/shared/components/BottomNav';
import Home from '@/routes/Home';
import AssessmentRoute from '@/routes/AssessmentRoute';
import TrainingRoute from '@/routes/TrainingRoute';
import ProgressRoute from '@/routes/ProgressRoute';
import ProfileRoute from '@/routes/ProfileRoute';

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
function App() {
  return (
    <ErrorBoundary>
      <UserSettingsProvider>
        <AppProvider>
          <SessionProvider>
            <div className="min-h-screen bg-background pb-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assessment" element={<AssessmentRoute />} />
                <Route path="/training" element={<TrainingRoute />} />
                <Route path="/progress" element={<ProgressRoute />} />
                <Route path="/profile" element={<ProfileRoute />} />
              </Routes>
              <BottomNav />
            </div>
          </SessionProvider>
        </AppProvider>
      </UserSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
