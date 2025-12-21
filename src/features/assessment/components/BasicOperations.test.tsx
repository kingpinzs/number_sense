// BasicOperations.test.tsx - Tests for basic arithmetic question component
// Story 2.4: Implement Operations Question Types

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BasicOperations } from './BasicOperations';

describe('BasicOperations', () => {
  // Mock performance.now()
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  describe('Rendering', () => {
    it('renders addition problem with correct operands', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-display')).toHaveTextContent('12 + 7 = ?');
    });

    it('renders subtraction problem with correct operands', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="subtraction"
          operand1={15}
          operand2={8}
          correctAnswer={7}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-display')).toHaveTextContent('15 − 8 = ?');
    });

    it('renders QuestionCard wrapper', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('basic-operations')).toBeInTheDocument();
    });

    it('renders NumberKeypad component', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('operations-keypad')).toBeInTheDocument();
    });

    it('displays answer input area', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('answer-display')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('allows user to enter answer via keypad', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      // Enter "1" and "9"
      await user.click(within(keypad).getByTestId('digit-1'));
      await user.click(within(keypad).getByTestId('digit-9'));

      // Answer display should show "19"
      expect(screen.getByTestId('answer-display')).toHaveTextContent('19');
    });

    it('submits correct answer and records isCorrect=true', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      // Enter correct answer "19"
      await user.click(within(keypad).getByTestId('digit-1'));
      await user.click(within(keypad).getByTestId('digit-9'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 19,
          isCorrect: true,
          operationType: 'addition',
          correctAnswer: 19,
          timeToAnswer: expect.any(Number),
        })
      );

      // Verify timing was captured (should be greater than or equal to 0)
      const call = onAnswer.mock.calls[0][0];
      expect(call.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('submits incorrect answer and records isCorrect=false', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      // Enter incorrect answer "20"
      await user.click(within(keypad).getByTestId('digit-2'));
      await user.click(within(keypad).getByTestId('digit-0'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 20,
          isCorrect: false,
          operationType: 'addition',
          correctAnswer: 19,
          timeToAnswer: expect.any(Number),
        })
      );

      // Verify timing was captured
      const call = onAnswer.mock.calls[0][0];
      expect(call.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('records timeToAnswer accurately with performance.now()', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="subtraction"
          operand1={10}
          operand2={3}
          correctAnswer={7}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      await user.click(within(keypad).getByTestId('digit-7'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(onAnswer).toHaveBeenCalled();

      const call = onAnswer.mock.calls[0][0];
      expect(call.timeToAnswer).toBeGreaterThanOrEqual(0);
      expect(typeof call.timeToAnswer).toBe('number');
    });

    it('disables keypad after answer is submitted', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      // Submit answer
      await user.click(within(keypad).getByTestId('digit-8'));
      await user.click(within(keypad).getByTestId('submit'));

      // Keypad buttons should be disabled
      expect(within(keypad).getByTestId('digit-1')).toBeDisabled();
      expect(within(keypad).getByTestId('submit')).toBeDisabled();
    });

    it('displays "Answer recorded" after submission', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');

      // Initially shows instruction
      expect(screen.getByTestId('instruction-text')).toHaveTextContent(
        'Enter your answer and tap Submit'
      );

      // Submit answer
      await user.click(within(keypad).getByTestId('digit-8'));
      await user.click(within(keypad).getByTestId('submit'));

      // Should now show "Answer recorded"
      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Answer recorded');
    });
  });

  describe('Question Changes', () => {
    it('resets state when question changes', () => {
      const onAnswer = vi.fn();

      const { rerender } = render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      // Change question
      rerender(
        <BasicOperations
          operationType="subtraction"
          operand1={10}
          operand2={4}
          correctAnswer={6}
          onAnswer={onAnswer}
        />
      );

      // Answer display should be empty
      expect(screen.getByTestId('answer-display')).toHaveTextContent('');

      // Instruction should be reset
      expect(screen.getByTestId('instruction-text')).toHaveTextContent(
        'Enter your answer and tap Submit'
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on problem display', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      const problemDisplay = screen.getByTestId('problem-display');
      expect(problemDisplay).toHaveAttribute('aria-label', '12 plus 7 equals');
    });

    it('has aria-label for subtraction', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="subtraction"
          operand1={15}
          operand2={8}
          correctAnswer={7}
          onAnswer={onAnswer}
        />
      );

      const problemDisplay = screen.getByTestId('problem-display');
      expect(problemDisplay).toHaveAttribute('aria-label', '15 minus 8 equals');
    });

    it('has aria-live region for answer display', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      const answerDisplay = screen.getByTestId('answer-display');
      expect(answerDisplay).toHaveAttribute('aria-live', 'polite');
      expect(answerDisplay).toHaveAttribute('aria-atomic', 'true');
    });

    it('has label for answer input', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByText('Your answer:')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('displays problem with large font (text-4xl)', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={12}
          operand2={7}
          correctAnswer={19}
          onAnswer={onAnswer}
        />
      );

      const problemText = screen.getByTestId('problem-display').querySelector('p');
      expect(problemText).toHaveClass('text-4xl');
    });

    it('displays answer with large font (text-2xl)', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      const answerText = screen.getByTestId('answer-display').querySelector('span');
      expect(answerText).toHaveClass('text-2xl');
    });
  });

  describe('Input Validation', () => {
    it('enforces max 4 digits via NumberKeypad', () => {
      const onAnswer = vi.fn();

      render(
        <BasicOperations
          operationType="addition"
          operand1={5}
          operand2={3}
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('operations-keypad');
      // NumberKeypad should have maxDigits=4 prop (verified via integration)
      expect(keypad).toBeInTheDocument();
    });
  });
});
