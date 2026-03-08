// InsightsPanel Component - Story 5.4
// Displays personalized insights cards with emoji icons and optional actions
// Architecture: Presentational component consuming useInsights hook

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useInsights } from '../hooks/useInsights';
import type { Insight } from '../services/insightsEngine';

const EMOJI_LABELS: Record<string, string> = {
  '📈': 'Upward trend',
  '📊': 'Chart',
  '⚡': 'Lightning bolt',
  '💪': 'Strong',
  '🎯': 'Target',
};

function InsightCard({ insight }: { insight: Insight }) {
  const navigate = useNavigate();

  return (
    <article className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <span
        role="img"
        aria-label={EMOJI_LABELS[insight.icon] || 'Insight icon'}
        className="text-2xl flex-shrink-0 mt-0.5"
      >
        {insight.icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">
          {insight.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {insight.message}
        </p>
        {insight.action && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 min-h-[44px]"
            onClick={() => navigate(insight.action!.route)}
          >
            {insight.action.label}
          </Button>
        )}
      </div>
    </article>
  );
}

export default function InsightsPanel() {
  const { isLoading, insights, hasEnoughData, error } = useInsights();

  return (
    <Card className="mb-6" data-testid="insights-panel">
      <CardHeader>
        <CardTitle className="text-lg">Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* Empty State (AC-6) */}
        {!isLoading && !error && !hasEnoughData && (
          <p
            className="text-muted-foreground text-center py-8"
            data-testid="insights-empty"
          >
            Complete a few more sessions to unlock personalized insights!
          </p>
        )}

        {/* Insights Cards (AC-3) */}
        {!isLoading && !error && hasEnoughData && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
