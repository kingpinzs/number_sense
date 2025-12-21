// NumberKeypad - Reusable numeric input component for assessments
// Story 2.4: Implement Operations Question Types
// Provides 0-9 digit buttons, backspace, and submit functionality

import { Button } from './ui/button';

export interface NumberKeypadProps {
  /** Current input value as string */
  value: string;
  /** Called when value changes (digit pressed or backspace) */
  onChange: (value: string) => void;
  /** Called when submit button is pressed */
  onSubmit: () => void;
  /** Maximum number of digits allowed (default: 4) */
  maxDigits?: number;
  /** Whether the keypad is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * NumberKeypad - Numeric input with 0-9, backspace, and submit
 *
 * Features:
 * - Grid layout with digits 1-9, 0, backspace, submit
 * - Enforces maxDigits constraint
 * - 60px+ touch targets for accessibility
 * - Keyboard navigation support
 * - Non-negative integers only
 */
export function NumberKeypad({
  value,
  onChange,
  onSubmit,
  maxDigits = 4,
  disabled = false,
  'data-testid': testId = 'number-keypad',
}: NumberKeypadProps) {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length >= maxDigits) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleSubmit = () => {
    if (disabled) return;
    if (value.length === 0) return; // Don't submit empty values
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div
      className="grid grid-cols-3 gap-2 max-w-xs mx-auto"
      data-testid={testId}
      role="group"
      aria-label="Number keypad"
    >
      {/* Digits 1-9 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
        <Button
          key={digit}
          variant="outline"
          onClick={() => handleDigit(String(digit))}
          onKeyDown={(e) => handleKeyDown(e, () => handleDigit(String(digit)))}
          disabled={disabled || value.length >= maxDigits}
          className="min-h-[60px] min-w-[60px] text-2xl font-semibold"
          data-testid={`digit-${digit}`}
          aria-label={`Button ${digit}`}
          type="button"
        >
          {digit}
        </Button>
      ))}

      {/* Backspace button */}
      <Button
        variant="outline"
        onClick={handleBackspace}
        onKeyDown={(e) => handleKeyDown(e, handleBackspace)}
        disabled={disabled || value.length === 0}
        className="min-h-[60px] min-w-[60px] text-xl"
        data-testid="backspace"
        aria-label="Backspace"
        type="button"
      >
        ⌫
      </Button>

      {/* Zero button */}
      <Button
        variant="outline"
        onClick={() => handleDigit('0')}
        onKeyDown={(e) => handleKeyDown(e, () => handleDigit('0'))}
        disabled={disabled || value.length >= maxDigits}
        className="min-h-[60px] min-w-[60px] text-2xl font-semibold"
        data-testid="digit-0"
        aria-label="Button 0"
        type="button"
      >
        0
      </Button>

      {/* Submit button */}
      <Button
        variant="default"
        onClick={handleSubmit}
        onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
        disabled={disabled || value.length === 0}
        className="min-h-[60px] min-w-[60px] text-base font-medium"
        data-testid="submit"
        aria-label="Submit"
        type="button"
      >
        Submit
      </Button>
    </div>
  );
}

export default NumberKeypad;
