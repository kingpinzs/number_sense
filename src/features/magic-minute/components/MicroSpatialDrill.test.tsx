/**
 * MicroSpatialDrill Component Tests
 * Story 4.3: Micro-Challenge Generation Engine - Spatial Drill
 *
 * Tests for the spatial rotation micro-challenge that presents
 * two shapes and asks the user if they are the same after rotation.
 * Covers rendering, button interactions, keyboard shortcuts,
 * timeout behavior, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MicroSpatialDrill from './MicroSpatialDrill';
import type { MicroSpatialDrillProps } from './MicroSpatialDrill';
import type { MicroSpatialParams, MicroChallengeResult } from '../types/microChallenge.types';
import type { MistakeType } from '@/services/adaptiveDifficulty/mistakeAnalyzer';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock shapes module with simple components
vi.mock('@/features/training/content/shapes', () => ({
  SHAPES: {
    lshape: (props: any) => <div data-testid="shape" {...props} />,
    tshape: (props: any) => <div data-testid="shape" {...props} />,
  },
  rotateShape: (deg: number) => ({ transform: `rotate(${deg}deg)` }),
}));

// Default test props
const defaultParams: MicroSpatialParams = {
  shape: 'lshape',
  rotation: 90,
  isSame: true,
};

const createProps = (overrides: Partial<MicroSpatialDrillProps> = {}): MicroSpatialDrillProps => ({
  challengeId: 'test-challenge-1',
  params: defaultParams,
  targetMistakeType: 'overestimation' as MistakeType,
  onComplete: vi.fn<(result: MicroChallengeResult) => void>(),
  timeRemaining: 45,
  ...overrides,
});

describe('MicroSpatialDrill', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock window.matchMedia for prefersReducedMotion
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  // ---------------------------------------------------------------
  // Rendering tests
  // ---------------------------------------------------------------

  it('renders "Are these the same?" prompt', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    expect(screen.getByText(/Are these the/i)).toBeInTheDocument();
    expect(screen.getByText('same')).toBeInTheDocument();
  });

  it('renders two shapes side by side', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    const shapes = screen.getAllByTestId('shape');
    expect(shapes).toHaveLength(2);
  });

  it('Same button shows "Same" text', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    expect(screen.getByRole('button', { name: /same/i })).toHaveTextContent('Same');
  });

  it('Different button shows "Different" text', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    expect(screen.getByRole('button', { name: /different/i })).toHaveTextContent('Different');
  });

  it('shows keyboard shortcut hint text', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText(/for Same/i)).toBeInTheDocument();
    expect(screen.getByText(/for Different/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Button interaction tests
  // ---------------------------------------------------------------

  it('clicking Same when isSame=true calls onComplete with correct: true', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'lshape', rotation: 90, isSame: true },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /same - shapes are identical/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        challengeId: 'test-challenge-1',
        challengeType: 'spatial',
        mistakeTypeTargeted: 'overestimation',
        timedOut: false,
        timeToAnswer: expect.any(Number),
      })
    );
  });

  it('clicking Same when isSame=false calls onComplete with correct: false', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'lshape', rotation: 90, isSame: false },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /same - shapes are identical/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: false,
        timedOut: false,
      })
    );
  });

  it('clicking Different when isSame=false calls onComplete with correct: true', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'tshape', rotation: 180, isSame: false },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /different - shapes are not identical/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        timedOut: false,
      })
    );
  });

  it('clicking Different when isSame=true calls onComplete with correct: false', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'tshape', rotation: 180, isSame: true },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /different - shapes are not identical/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: false,
        timedOut: false,
      })
    );
  });

  // ---------------------------------------------------------------
  // Timeout test
  // ---------------------------------------------------------------

  it('8-second timeout calls onComplete with timedOut: true', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({ onComplete });
    render(<MicroSpatialDrill {...props} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: false,
        timedOut: true,
        challengeType: 'spatial',
      })
    );
  });

  // ---------------------------------------------------------------
  // Keyboard shortcut tests
  // ---------------------------------------------------------------

  it('keyboard "s" triggers Same answer', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'lshape', rotation: 90, isSame: true },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.keyDown(window, { key: 's' });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        timedOut: false,
      })
    );
  });

  it('keyboard "d" triggers Different answer', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'lshape', rotation: 90, isSame: false },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.keyDown(window, { key: 'd' });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        timedOut: false,
      })
    );
  });

  it('keyboard "1" triggers Same answer', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'lshape', rotation: 90, isSame: true },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.keyDown(window, { key: '1' });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        timedOut: false,
      })
    );
  });

  it('keyboard "2" triggers Different answer', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({
      onComplete,
      params: { shape: 'tshape', rotation: 90, isSame: false },
    });
    render(<MicroSpatialDrill {...props} />);

    fireEvent.keyDown(window, { key: '2' });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        correct: true,
        timedOut: false,
      })
    );
  });

  // ---------------------------------------------------------------
  // Submission guard test
  // ---------------------------------------------------------------

  it('cannot click after submission (isSubmitting guard)', () => {
    const onComplete = vi.fn<(result: MicroChallengeResult) => void>();
    const props = createProps({ onComplete });
    render(<MicroSpatialDrill {...props} />);

    // First click should go through
    fireEvent.click(screen.getByRole('button', { name: /same - shapes are identical/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Second click should be blocked by isSubmitting guard
    fireEvent.click(screen.getByRole('button', { name: /different - shapes are not identical/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Keyboard should also be blocked
    fireEvent.keyDown(window, { key: 'd' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------
  // Accessibility tests
  // ---------------------------------------------------------------

  it('has correct aria-labels on buttons', () => {
    const props = createProps();
    render(<MicroSpatialDrill {...props} />);

    const sameButton = screen.getByRole('button', { name: /same - shapes are identical after rotation/i });
    expect(sameButton).toBeInTheDocument();
    expect(sameButton).toHaveAttribute('aria-label', 'Same - shapes are identical after rotation');

    const differentButton = screen.getByRole('button', { name: /different - shapes are not identical/i });
    expect(differentButton).toBeInTheDocument();
    expect(differentButton).toHaveAttribute('aria-label', 'Different - shapes are not identical');
  });
});
