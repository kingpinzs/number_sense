// QuestionCard.test.tsx - Unit tests for QuestionCard component
// Story 2.2: Implement Number Sense Question Types
// AC: All questions rendered in QuestionCard component with consistent styling

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../../tests/test-utils';
import { QuestionCard } from './QuestionCard';

describe('QuestionCard', () => {
  describe('Rendering', () => {
    it('renders question text', () => {
      render(
        <QuestionCard question="Which group has more dots?">
          <div>Content</div>
        </QuestionCard>
      );

      expect(screen.getByTestId('question-prompt')).toHaveTextContent('Which group has more dots?');
    });

    it('renders children content', () => {
      render(
        <QuestionCard question="Test question">
          <button data-testid="test-child">Click me</button>
        </QuestionCard>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(
        <QuestionCard
          question="Test question"
          footer={<button>Submit</button>}
        >
          <div>Content</div>
        </QuestionCard>
      );

      expect(screen.getByTestId('question-footer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('does not render footer when not provided', () => {
      render(
        <QuestionCard question="Test question">
          <div>Content</div>
        </QuestionCard>
      );

      expect(screen.queryByTestId('question-footer')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies consistent card styling', () => {
      render(
        <QuestionCard question="Test">
          <div>Content</div>
        </QuestionCard>
      );

      const card = screen.getByTestId('question-card');
      expect(card).toHaveClass('w-full', 'max-w-lg', 'mx-auto');
    });

    it('applies custom className when provided', () => {
      render(
        <QuestionCard question="Test" className="custom-class">
          <div>Content</div>
        </QuestionCard>
      );

      const card = screen.getByTestId('question-card');
      expect(card).toHaveClass('custom-class');
    });

    it('centers question text', () => {
      render(
        <QuestionCard question="Test">
          <div>Content</div>
        </QuestionCard>
      );

      const questionPrompt = screen.getByTestId('question-prompt');
      expect(questionPrompt).toHaveClass('text-center');
    });
  });

  describe('Test ID Support', () => {
    it('uses default test id', () => {
      render(
        <QuestionCard question="Test">
          <div>Content</div>
        </QuestionCard>
      );

      expect(screen.getByTestId('question-card')).toBeInTheDocument();
    });

    it('accepts custom test id', () => {
      render(
        <QuestionCard question="Test" data-testid="custom-card">
          <div>Content</div>
        </QuestionCard>
      );

      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });
});
