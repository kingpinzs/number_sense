// NumberKeypad.test.tsx - Comprehensive tests for numeric input component
// Story 2.4: Implement Operations Question Types

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NumberKeypad } from './NumberKeypad';

describe('NumberKeypad', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders all digit buttons 0-9', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      // Verify all 10 digits are present
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByTestId(`digit-${i}`)).toBeInTheDocument();
        expect(screen.getByLabelText(`Button ${i}`)).toBeInTheDocument();
      }
    });

    it('renders backspace button', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      const backspaceButton = screen.getByTestId('backspace');
      expect(backspaceButton).toBeInTheDocument();
      expect(screen.getByLabelText('Backspace')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      const submitButton = screen.getByTestId('submit');
      expect(submitButton).toBeInTheDocument();
      expect(screen.getByLabelText('Submit')).toBeInTheDocument();
    });

    it('renders with custom data-testid', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad
          value=""
          onChange={onChange}
          onSubmit={onSubmit}
          data-testid="custom-keypad"
        />
      );

      expect(screen.getByTestId('custom-keypad')).toBeInTheDocument();
    });
  });

  // Digit input functionality
  describe('Digit Input', () => {
    it('calls onChange with digit when digit button is clicked', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('digit-5'));

      expect(onChange).toHaveBeenCalledWith('5');
    });

    it('appends digits to existing value', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="12" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('digit-3'));

      expect(onChange).toHaveBeenCalledWith('123');
    });

    it('allows typing all digits in sequence', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      // Click digit 1
      await user.click(screen.getByTestId('digit-1'));
      expect(onChange).toHaveBeenCalledWith('1');

      // Simulate value update
      rerender(<NumberKeypad value="1" onChange={onChange} onSubmit={onSubmit} />);

      // Click digit 2
      await user.click(screen.getByTestId('digit-2'));
      expect(onChange).toHaveBeenCalledWith('12');

      // Simulate value update
      rerender(<NumberKeypad value="12" onChange={onChange} onSubmit={onSubmit} />);

      // Click digit 3
      await user.click(screen.getByTestId('digit-3'));
      expect(onChange).toHaveBeenCalledWith('123');
    });
  });

  // Max digits constraint
  describe('Max Digits Validation', () => {
    it('enforces default maxDigits of 4', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="1234" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('digit-5'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('enforces custom maxDigits prop', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad
          value="12"
          onChange={onChange}
          onSubmit={onSubmit}
          maxDigits={2}
        />
      );

      await user.click(screen.getByTestId('digit-3'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('disables digit buttons when maxDigits reached', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad
          value="123"
          onChange={onChange}
          onSubmit={onSubmit}
          maxDigits={3}
        />
      );

      // All digit buttons should be disabled
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByTestId(`digit-${i}`)).toBeDisabled();
      }
    });
  });

  // Backspace functionality
  describe('Backspace', () => {
    it('removes last digit when backspace is clicked', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="123" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('backspace'));

      expect(onChange).toHaveBeenCalledWith('12');
    });

    it('handles backspace on single digit', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="5" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('backspace'));

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('does nothing when value is empty', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('backspace'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('is disabled when value is empty', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      expect(screen.getByTestId('backspace')).toBeDisabled();
    });
  });

  // Submit functionality
  describe('Submit', () => {
    it('calls onSubmit when submit button is clicked', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="42" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('submit'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when value is empty', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      await user.click(screen.getByTestId('submit'));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('is disabled when value is empty', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      expect(screen.getByTestId('submit')).toBeDisabled();
    });
  });

  // Disabled state
  describe('Disabled State', () => {
    it('disables all buttons when disabled prop is true', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad
          value="123"
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={true}
        />
      );

      // All digit buttons should be disabled
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByTestId(`digit-${i}`)).toBeDisabled();
      }

      expect(screen.getByTestId('backspace')).toBeDisabled();
      expect(screen.getByTestId('submit')).toBeDisabled();
    });

    it('prevents onChange when disabled', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad
          value=""
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={true}
        />
      );

      await user.click(screen.getByTestId('digit-5'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('prevents onSubmit when disabled', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad
          value="42"
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={true}
        />
      );

      await user.click(screen.getByTestId('submit'));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // Keyboard navigation
  describe('Keyboard Navigation', () => {
    it('supports Enter key for digit buttons', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      const digit5 = screen.getByTestId('digit-5');
      digit5.focus();
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith('5');
    });

    it('supports Space key for digit buttons', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      const digit3 = screen.getByTestId('digit-3');
      digit3.focus();
      await user.keyboard(' ');

      expect(onChange).toHaveBeenCalledWith('3');
    });

    it('supports Enter key for submit button', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <NumberKeypad value="42" onChange={onChange} onSubmit={onSubmit} />
      );

      const submitButton = screen.getByTestId('submit');
      submitButton.focus();
      await user.keyboard('{Enter}');

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('has proper ARIA labels on digit buttons', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      for (let i = 0; i <= 9; i++) {
        expect(screen.getByLabelText(`Button ${i}`)).toBeInTheDocument();
      }
    });

    it('has proper ARIA label on backspace button', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="123" onChange={onChange} onSubmit={onSubmit} />
      );

      expect(screen.getByLabelText('Backspace')).toBeInTheDocument();
    });

    it('has proper ARIA label on submit button', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="42" onChange={onChange} onSubmit={onSubmit} />
      );

      expect(screen.getByLabelText('Submit')).toBeInTheDocument();
    });

    it('has role="group" for keyboard grouping', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      const keypad = screen.getByRole('group', { name: 'Number keypad' });
      expect(keypad).toBeInTheDocument();
    });

    it('buttons are keyboard focusable', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      // All buttons should be focusable (not aria-hidden or tabindex=-1)
      const digit1 = screen.getByTestId('digit-1');
      expect(digit1).not.toHaveAttribute('aria-hidden');
      expect(digit1).not.toHaveAttribute('tabindex', '-1');
    });
  });

  // Touch targets
  describe('Touch Targets', () => {
    it('has minimum 60px touch targets for accessibility', () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn();

      render(
        <NumberKeypad value="" onChange={onChange} onSubmit={onSubmit} />
      );

      // Check digit button has min-h-[60px] class
      const digit1 = screen.getByTestId('digit-1');
      expect(digit1).toHaveClass('min-h-[60px]');
      expect(digit1).toHaveClass('min-w-[60px]');

      // Check submit button
      const submit = screen.getByTestId('submit');
      expect(submit).toHaveClass('min-h-[60px]');
      expect(submit).toHaveClass('min-w-[60px]');
    });
  });
});
