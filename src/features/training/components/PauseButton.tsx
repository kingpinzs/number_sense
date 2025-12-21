// PauseButton - Pause training session with modal options
// Story 3.5: Build Drill Session UI Components
// Shows pause button and modal with Resume/End Session options

import { useState } from 'react';
import { Pause } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

export interface PauseButtonProps {
  currentDrill: number;
  totalDrills: number;
  onResume: () => void;
  onEndSession: () => void;
}

/**
 * PauseButton component
 *
 * AC: Pause button with modal
 * - Icon button (⏸ pause symbol, 44px tap target)
 * - Opens pause modal with "Resume" and "End Session Early" buttons
 * - Shows current progress: "X of Y drills complete"
 * - Resume button uses coral/primary color
 * - End Session button uses gray color with confirmation
 *
 * @param currentDrill - Current drill number (1-indexed)
 * @param totalDrills - Total number of drills in session
 * @param onResume - Callback when user clicks Resume
 * @param onEndSession - Callback when user confirms End Session Early
 */
export default function PauseButton({ currentDrill, totalDrills, onResume, onEndSession }: PauseButtonProps) {
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  const handlePauseClick = () => {
    setIsPauseModalOpen(true);
  };

  const handleResume = () => {
    setIsPauseModalOpen(false);
    setShowEndConfirmation(false);
    onResume();
  };

  const handleEndSessionRequest = () => {
    setShowEndConfirmation(true);
  };

  const handleEndSessionConfirm = () => {
    setIsPauseModalOpen(false);
    setShowEndConfirmation(false);
    onEndSession();
  };

  const handleEndSessionCancel = () => {
    setShowEndConfirmation(false);
  };

  return (
    <>
      {/* Pause button - 44px tap target */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePauseClick}
        className="min-w-[44px] min-h-[44px]"
        aria-label="Pause session"
        data-testid="pause-button"
      >
        <Pause className="h-6 w-6" />
      </Button>

      {/* Pause modal */}
      <Dialog open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {showEndConfirmation ? 'End Session Early?' : 'Session Paused'}
            </DialogTitle>
            <DialogDescription>
              {showEndConfirmation ? (
                <>
                  Are you sure you want to end this session early? Your progress will be saved, but you won't complete all drills.
                </>
              ) : (
                <>
                  {currentDrill} of {totalDrills} drills complete
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!showEndConfirmation ? (
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleResume}
                className="w-full"
                data-testid="resume-button"
              >
                Resume
              </Button>
              <Button
                onClick={handleEndSessionRequest}
                variant="outline"
                className="w-full"
                data-testid="end-session-button"
              >
                End Session Early
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleEndSessionConfirm}
                variant="destructive"
                className="w-full"
                data-testid="confirm-end-session"
              >
                Yes, End Session
              </Button>
              <Button
                onClick={handleEndSessionCancel}
                variant="outline"
                className="w-full"
                data-testid="cancel-end-session"
              >
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
