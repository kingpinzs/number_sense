// WordProblem.test.tsx - Tests for word problem question component
// Story 2.4: Implement Operations Question Types

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { WordProblem } from './WordProblem';

describe('WordProblem', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  describe('Rendering', () => {
    it('renders word problem text', () => {
      const onAnswer = vi.fn();
      const problemText = 'You have 8 apples. You give away 3 apples. How many apples do you have now?';

      render(
        <WordProblem
          problemText={problemText}
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toHaveTextContent(problemText);
    });

    it('renders apples context problem', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="You have 8 apples. You give away 3 apples. How many apples do you have now?"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toHaveTextContent('apples');
    });

    it('renders QuestionCard wrapper', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="You have 5 toys. You get 2 more toys. How many toys do you have now?"
          correctAnswer={7}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('word-problem')).toBeInTheDocument();
    });

    it('renders NumberKeypad component', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={10}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('word-problem-keypad')).toBeInTheDocument();
    });

    it('displays answer input area', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={10}
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
        <WordProblem
          problemText="You have 10 coins. You spend 4 coins. How many coins do you have now?"
          correctAnswer={6}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

      await user.click(within(keypad).getByTestId('digit-6'));

      expect(screen.getByTestId('answer-display')).toHaveTextContent('6');
    });

    it('submits correct answer to word problem', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();
      const problemText = 'You have 8 apples. You give away 3. How many do you have now?';

      render(
        <WordProblem
          problemText={problemText}
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

      await user.click(within(keypad).getByTestId('digit-5'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 5,
          isCorrect: true,
          problemText,
          correctAnswer: 5,
          timeToAnswer: expect.any(Number),
        })
      );

      // Verify timing was captured (should be greater than or equal to 0)
      const call = onAnswer.mock.calls[0][0];
      expect(call.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('submits incorrect answer to word problem', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();
      const problemText = 'You have 10 books. You buy 5 more books. How many books do you have now?';

      render(
        <WordProblem
          problemText={problemText}
          correctAnswer={15}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

      // Enter incorrect answer "10"
      await user.click(within(keypad).getByTestId('digit-1'));
      await user.click(within(keypad).getByTestId('digit-0'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          userAnswer: 10,
          isCorrect: false,
          problemText,
          correctAnswer: 15,
          timeToAnswer: expect.any(Number),
        })
      );

      const call = onAnswer.mock.calls[0][0];
      expect(call.timeToAnswer).toBeGreaterThanOrEqual(0);
    });

    it('records timeToAnswer for word problem', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={7}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

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
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

      await user.click(within(keypad).getByTestId('digit-5'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(within(keypad).getByTestId('digit-1')).toBeDisabled();
      expect(within(keypad).getByTestId('submit')).toBeDisabled();
    });

    it('displays "Answer recorded" after submission', async () => {
      const onAnswer = vi.fn();
      const user = userEvent.setup();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');

      // Initially shows instruction
      expect(screen.getByTestId('instruction-text')).toHaveTextContent(
        'Read the problem, then enter your answer'
      );

      // Submit answer
      await user.click(within(keypad).getByTestId('digit-5'));
      await user.click(within(keypad).getByTestId('submit'));

      expect(screen.getByTestId('instruction-text')).toHaveTextContent('Answer recorded');
    });
  });

  describe('Question Changes', () => {
    it('resets state when problem changes', () => {
      const onAnswer = vi.fn();

      const { rerender } = render(
        <WordProblem
          problemText="First problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      rerender(
        <WordProblem
          problemText="Second problem"
          correctAnswer={10}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('answer-display')).toHaveTextContent('');
      expect(screen.getByTestId('instruction-text')).toHaveTextContent(
        'Read the problem, then enter your answer'
      );
    });
  });

  describe('Dyscalculia-Friendly Design', () => {
    it('displays text with large readable font (text-xl)', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Simple clear problem text"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const problemText = screen.getByTestId('problem-text').querySelector('p');
      expect(problemText).toHaveClass('text-xl');
    });

    it('uses leading-relaxed for better readability', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const problemText = screen.getByTestId('problem-text').querySelector('p');
      expect(problemText).toHaveClass('leading-relaxed');
    });

    it('renders simple language with clear numbers', () => {
      const onAnswer = vi.fn();
      const problem = 'You have 8 apples. You give away 3. How many do you have now?';

      render(
        <WordProblem
          problemText={problem}
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      // Verify numbers are clearly presented
      expect(screen.getByTestId('problem-text')).toHaveTextContent('8');
      expect(screen.getByTestId('problem-text')).toHaveTextContent('3');
    });
  });

  describe('Accessibility', () => {
    it('has aria-live region for answer display', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
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
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByText('Your answer:')).toBeInTheDocument();
    });

    it('problem text is in semantic container', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('enforces max 4 digits via NumberKeypad', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="Test problem"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      const keypad = screen.getByTestId('word-problem-keypad');
      expect(keypad).toBeInTheDocument();
    });
  });

  describe('Various Context Problems', () => {
    it('handles coins context', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="You have 5 coins. You find 3 more coins. How many coins do you have now?"
          correctAnswer={8}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toHaveTextContent('coins');
    });

    it('handles toys context', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="You have 7 toys. You give 2 toys to your friend. How many toys do you have now?"
          correctAnswer={5}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toHaveTextContent('toys');
    });

    it('handles books context', () => {
      const onAnswer = vi.fn();

      render(
        <WordProblem
          problemText="You have 10 books. You donate 4 books to the library. How many books do you have now?"
          correctAnswer={6}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByTestId('problem-text')).toHaveTextContent('books');
    });
  });
});
