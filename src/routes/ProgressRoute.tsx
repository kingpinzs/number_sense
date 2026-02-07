// ProgressRoute - Story 5.1, 5.2
// Displays user progress with confidence radar chart and session history
// Architecture: Route component with data fetching

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import ConfidenceRadar, { ConfidenceRadarEmpty } from '@/features/progress/components/ConfidenceRadar';
import { useConfidenceData } from '@/features/progress/hooks/useConfidenceData';
import SessionHistory from '@/features/progress/components/SessionHistory';

/**
 * ProgressRoute - Main progress tracking page
 *
 * Displays:
 * - Confidence Radar chart showing domain confidence over time
 * - Empty state when user has < 3 training sessions
 * - Loading state while fetching data
 */
export default function ProgressRoute() {
  const {
    isLoading,
    current,
    baseline,
    hasEnoughData,
    error,
  } = useConfidenceData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-foreground mb-6">
          Your Progress
        </h1>

        {/* Confidence Radar Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Confidence Radar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="large" />
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please try refreshing the page.
                </p>
              </div>
            )}

            {/* Empty State (AC-4) */}
            {!isLoading && !error && !hasEnoughData && (
              <ConfidenceRadarEmpty />
            )}

            {/* Confidence Radar Chart (AC-1) */}
            {!isLoading && !error && hasEnoughData && current && (
              <ConfidenceRadar
                current={current}
                baseline={baseline}
              />
            )}
          </CardContent>
        </Card>

        {/* Session History (Story 5.2) */}
        <SessionHistory />
      </div>
    </div>
  );
}
