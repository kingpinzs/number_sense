// SessionHistory Component - Story 5.2
// Renders paginated session history with date-grouped cards

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Accordion } from '@/shared/components/ui/accordion';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { groupSessionsByDate } from '../utils/dateFormatters';
import SessionCard from './SessionCard';

export default function SessionHistory() {
  const { isLoading, sessions, hasMore, error, loadMore } = useSessionHistory();
  const navigate = useNavigate();

  const groupedSessions = useMemo(
    () => groupSessionsByDate(sessions),
    [sessions]
  );

  // Loading state
  if (isLoading && sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No training sessions yet. Start your first session!
            </p>
            <Button onClick={() => navigate('/training')}>
              Start Training
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session History</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {Array.from(groupedSessions.entries()).map(([dateGroup, groupSessions]) => (
            <div key={dateGroup} className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-card z-10 py-1">
                {dateGroup}
              </h3>
              <div className="space-y-2">
                {groupSessions.map((session, index) => (
                  <SessionCard
                    key={session.id ?? index}
                    session={session}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </Accordion>

        {/* Load More button */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
