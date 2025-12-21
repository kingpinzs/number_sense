// SessionProgressBar - Training session progress indicator
// Story 3.5: Build Drill Session UI Components
// Shows current drill position and progress bar with coral color

import { Progress } from '@/shared/components/ui/progress';

export interface SessionProgressBarProps {
  currentIndex: number;
  totalDrills: number;
}

/**
 * SessionProgressBar component
 *
 * AC: Shows "Drill X of Y" text and horizontal progress bar
 * - Displays current drill number (1-indexed for UX)
 * - Shows total drills
 * - Coral-colored progress bar (0-100% filled)
 * - Animated fill with transition (built into Progress component)
 * - Positioned at top of training session view
 *
 * @param currentIndex - Current drill index (0-based)
 * @param totalDrills - Total number of drills in session
 */
export default function SessionProgressBar({ currentIndex, totalDrills }: SessionProgressBarProps) {
  // Convert 0-based index to 1-based for display
  const currentDrill = currentIndex + 1;

  // Calculate progress percentage (0-100)
  const progressPercentage = totalDrills > 0 ? (currentDrill / totalDrills) * 100 : 0;

  return (
    <div
      className="w-full space-y-2"
      data-testid="session-progress-bar"
      role="region"
      aria-label="Training session progress"
    >
      {/* Drill count text */}
      <div className="text-sm font-medium text-gray-700 text-center">
        Drill {currentDrill} of {totalDrills}
      </div>

      {/* Progress bar with coral color */}
      <Progress
        value={progressPercentage}
        className="h-2"
        style={{ '--progress-background': 'hsl(var(--primary))' } as React.CSSProperties}
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(progressPercentage)}% complete`}
      />
    </div>
  );
}
