// SessionCompletionSummary - Session completion stats and navigation
// Story 3.6: Implement Confidence Prompt System
// Displays after confidence prompt with session stats and navigation options

import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import Confetti from 'react-confetti-boom';

export interface SessionCompletionSummaryProps {
  isOpen: boolean;
  drillCount: number;
  accuracy: number; // 0-100
  confidenceChange: number | null;
}

/**
 * SessionCompletionSummary component
 *
 * AC-4: Displays session completion summary with:
 * - "Session Complete! 🎉"
 * - Stats: drillCount, accuracy, confidenceChange
 * - "View Progress" button → /progress
 * - "Done" button → / (home)
 *
 * Shows confetti animation if confidenceChange > 0
 *
 * @param isOpen - Controls dialog visibility
 * @param drillCount - Number of drills completed
 * @param accuracy - Accuracy percentage (0-100)
 * @param confidenceChange - Confidence delta (can be null)
 */
export default function SessionCompletionSummary({
  isOpen,
  drillCount,
  accuracy,
  confidenceChange,
}: SessionCompletionSummaryProps) {
  const navigate = useNavigate();

  /**
   * Get confidence message based on delta
   * AC-4: "Confidence boost: +2" (if positive) or "Confidence: No change" (if 0) or "Keep practicing!" (if negative)
   */
  const getConfidenceMessage = () => {
    if (confidenceChange === null || confidenceChange === undefined) {
      return null;
    }

    if (confidenceChange > 0) {
      return `Confidence boost: +${confidenceChange}`;
    } else if (confidenceChange === 0) {
      return 'Confidence: No change';
    } else {
      return 'Keep practicing!';
    }
  };

  const confidenceMessage = getConfidenceMessage();
  const showConfetti = confidenceChange !== null && confidenceChange > 0;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()} // Force user to click a button
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent ESC key dismiss
      >
        {/* Confetti animation for positive confidence change */}
        {showConfetti && (
          <div className="pointer-events-none">
            <Confetti
              mode="boom"
              particleCount={50}
              spreadDeg={60}
              shapeSize={8}
              effectInterval={2000}
              effectCount={1}
            />
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Session Complete! 🎉
          </DialogTitle>
        </DialogHeader>

        {/* Session stats */}
        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-accent/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Drills completed</p>
            <p className="text-3xl font-bold" data-testid="drills-completed">
              {drillCount}
            </p>
          </div>

          <div className="rounded-lg bg-accent/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-3xl font-bold" data-testid="accuracy">
              {accuracy}%
            </p>
          </div>

          {confidenceMessage && (
            <div className="rounded-lg bg-accent/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p
                className={`text-xl font-semibold ${
                  confidenceChange && confidenceChange > 0 ? 'text-green-600 dark:text-green-400' : ''
                }`}
                data-testid="confidence-change"
              >
                {confidenceMessage}
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => navigate('/progress')}
            variant="default"
            className="w-full"
            data-testid="view-progress-button"
          >
            View Progress
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
            data-testid="done-button"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
