/**
 * SessionFeedback Component Tests
 * Story 3.5: Build Drill Session UI Components
 *
 * Test Coverage:
 * - AC: Correct answer shows green checkmark and +1 animation
 * - AC: Incorrect answer shows red X and correct answer
 * - AC: Streak pulse animation when showStreakPulse=true
 * - AC: Success sound plays when correct (respects soundEnabled setting)
 * - AC: Accessibility (role="alert", aria-live)
 * - AC: Framer Motion animations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionFeedback from './SessionFeedback';
import * as UserSettingsContext from '@/context/UserSettingsContext';

// Mock Framer Motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock UserSettingsContext
vi.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: vi.fn(),
}));

// Mock Web Audio API
const mockAudioContext = {
  currentTime: 0,
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  })),
  destination: {},
  close: vi.fn(),
};

describe('SessionFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: sound enabled
    vi.spyOn(UserSettingsContext, 'useUserSettings').mockReturnValue({
      settings: {
        soundEnabled: true,
        reducedMotion: false,
        dailyGoalMinutes: 15,
        researchModeEnabled: false,
      },
      updateSettings: vi.fn(),
    });

    // Mock AudioContext
    global.AudioContext = vi.fn(() => mockAudioContext) as any;
  });

  describe('Correct Answer Feedback', () => {
    it('renders green checkmark for correct answer', () => {
      render(<SessionFeedback isCorrect={true} />);

      const container = screen.getByTestId('session-feedback');
      const checkIcon = container.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
    });

    it('renders +1 floating animation text', () => {
      render(<SessionFeedback isCorrect={true} />);

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('+1 text has correct styling', () => {
      render(<SessionFeedback isCorrect={true} />);

      const plusOne = screen.getByText('+1');
      expect(plusOne).toHaveClass('text-2xl', 'font-bold', 'text-green-600');
    });

    it('+1 text is aria-hidden for screen readers', () => {
      render(<SessionFeedback isCorrect={true} />);

      const plusOne = screen.getByText('+1');
      expect(plusOne).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not show correct answer text when answer is correct', () => {
      render(<SessionFeedback isCorrect={true} correctAnswer="42" />);

      expect(screen.queryByText(/Correct answer:/)).not.toBeInTheDocument();
    });

    it('shows streak pulse when showStreakPulse=true', () => {
      render(<SessionFeedback isCorrect={true} showStreakPulse={true} />);

      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('streak pulse has correct aria-label', () => {
      render(<SessionFeedback isCorrect={true} showStreakPulse={true} />);

      const flame = screen.getByRole('img', { name: 'Streak continues' });
      expect(flame).toBeInTheDocument();
    });

    it('does not show streak pulse when showStreakPulse=false', () => {
      render(<SessionFeedback isCorrect={true} showStreakPulse={false} />);

      expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    });

    it('plays success sound when soundEnabled=true', () => {
      render(<SessionFeedback isCorrect={true} />);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('does not play success sound when soundEnabled=false', () => {
      vi.spyOn(UserSettingsContext, 'useUserSettings').mockReturnValue({
        settings: {
          soundEnabled: false,
          reducedMotion: false,
          dailyGoalMinutes: 15,
          researchModeEnabled: false,
        },
        updateSettings: vi.fn(),
      });

      render(<SessionFeedback isCorrect={true} />);

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Incorrect Answer Feedback', () => {
    it('renders red X for incorrect answer', () => {
      render(<SessionFeedback isCorrect={false} />);

      const container = screen.getByTestId('session-feedback');
      const xIcon = container.querySelector('.text-red-600');
      expect(xIcon).toBeInTheDocument();
    });

    it('does not show +1 animation when incorrect', () => {
      render(<SessionFeedback isCorrect={false} />);

      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });

    it('does not show streak pulse when incorrect', () => {
      render(<SessionFeedback isCorrect={false} showStreakPulse={true} />);

      expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    });

    it('shows correct answer text when provided', () => {
      render(<SessionFeedback isCorrect={false} correctAnswer="42" />);

      expect(screen.getByText(/Correct answer:/)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('shows correct answer with number type', () => {
      render(<SessionFeedback isCorrect={false} correctAnswer={123} />);

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('correct answer is displayed in semibold font', () => {
      render(<SessionFeedback isCorrect={false} correctAnswer="42" />);

      const answerSpan = screen.getByText('42');
      expect(answerSpan).toHaveClass('font-semibold');
    });

    it('does not show correct answer text when not provided', () => {
      render(<SessionFeedback isCorrect={false} />);

      expect(screen.queryByText(/Correct answer:/)).not.toBeInTheDocument();
    });

    it('does not play sound when incorrect', () => {
      render(<SessionFeedback isCorrect={false} />);

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert" for screen readers', () => {
      render(<SessionFeedback isCorrect={true} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live="polite" for announcements', () => {
      render(<SessionFeedback isCorrect={true} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('has correct test id', () => {
      render(<SessionFeedback isCorrect={true} />);

      expect(screen.getByTestId('session-feedback')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct container classes', () => {
      render(<SessionFeedback isCorrect={true} />);

      const container = screen.getByTestId('session-feedback');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'gap-4', 'py-8');
    });

    it('checkmark has green background circle', () => {
      const { container } = render(<SessionFeedback isCorrect={true} />);

      const circle = container.querySelector('.bg-green-100');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass('w-20', 'h-20', 'rounded-full');
    });

    it('X icon has red background circle', () => {
      const { container } = render(<SessionFeedback isCorrect={false} />);

      const circle = container.querySelector('.bg-red-100');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass('w-20', 'h-20', 'rounded-full');
    });
  });
});
