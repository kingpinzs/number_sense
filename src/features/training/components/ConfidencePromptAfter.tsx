// ConfidencePromptAfter - Post-session confidence capture modal
// Story 3.6: Implement Confidence Prompt System
// Displays after final drill with 5 emoji options (1-5 scale)

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

export interface ConfidencePromptAfterProps {
  isOpen: boolean;
  onSelect: (confidence: number) => void;
}

/**
 * Confidence options with emoji and label
 * 1-5 scale per AC-2
 */
const CONFIDENCE_OPTIONS = [
  { value: 1, emoji: '😟', label: 'Not confident' },
  { value: 2, emoji: '😐', label: 'A bit unsure' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Pretty good' },
  { value: 5, emoji: '🤩', label: 'Very confident!' },
] as const;

/**
 * ConfidencePromptAfter component
 *
 * AC-2: Renders after final drill with:
 * - Question: "How do you feel about math now?"
 * - Same 5 emoji options (44px tap targets)
 * - User selection required
 * - Selected confidence stored in SessionContext as confidenceAfter: 1-5
 * - Triggers confidenceChange calculation in SessionContext
 *
 * @param isOpen - Controls dialog visibility
 * @param onSelect - Callback when user selects confidence level (1-5)
 */
export default function ConfidencePromptAfter({ isOpen, onSelect }: ConfidencePromptAfterProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[400px] bg-white"
        onInteractOutside={(e) => e.preventDefault()} // AC-2: Force user selection
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent ESC key dismiss
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            How do you feel about math now?
          </DialogTitle>
        </DialogHeader>

        {/* Emoji option buttons */}
        <div className="flex flex-col gap-2 py-2">
          {CONFIDENCE_OPTIONS.map(({ value, emoji, label }) => (
            <Button
              key={value}
              onClick={() => onSelect(value)}
              variant="outline"
              className="h-auto min-h-[44px] flex-row justify-start gap-3 px-4 py-2 text-base hover:bg-accent"
              aria-label={`Select ${label} confidence level`}
              data-testid={`confidence-after-${value}`}
            >
              {/* Emoji with 44px tap target */}
              <span className="text-2xl" role="img" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-sm">{label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
