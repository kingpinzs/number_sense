// ResearchRoute - Story 8.3: Build Experiment Results Dashboard
// Dev-only route for A/B experiment results viewing
// Route guard: accessible in DEV mode or when Research Mode is enabled in Settings

import { Navigate } from 'react-router-dom';
import { useUserSettings } from '@/context/UserSettingsContext';
import ExperimentDashboard from '@/features/research/components/ExperimentDashboard';

/**
 * ResearchRoute - Gate for the /research experiment dashboard
 *
 * Accessible when:
 *   - Running in development mode (import.meta.env.DEV), OR
 *   - User has explicitly enabled Research Mode in Settings
 *
 * Otherwise redirects to home (/).
 */
export default function ResearchRoute() {
  const { settings } = useUserSettings();
  const canAccess = import.meta.env.DEV || settings.researchModeEnabled;

  if (!canAccess) return <Navigate to="/" replace />;

  return <ExperimentDashboard />;
}
