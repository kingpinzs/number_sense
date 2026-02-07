// SessionContext Tests
// Architecture: Unit and integration tests for SessionContext
// Coverage: session lifecycle, state transitions, action validation
// Story 3.1: Extended to test training session functionality

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider, useSession } from './SessionContext';
import type { DrillType } from '@/services/training/drillSelector';
import type { DrillResult } from '@/services/storage/schemas';

// Test component that uses SessionContext
function TestComponent() {
  const { state, startSession, endSession, pauseSession, resumeSession } = useSession();

  return (
    <div>
      <div data-testid="status">{state.sessionStatus}</div>
      <div data-testid="module">{state.currentModule || 'null'}</div>
      <div data-testid="session-id">{state.sessionId || 'null'}</div>
      <div data-testid="start-time">{state.startTime || 'null'}</div>
      <button onClick={() => startSession('training', 'session-123')}>Start Session</button>
      <button onClick={() => pauseSession()}>Pause Session</button>
      <button onClick={() => resumeSession()}>Resume Session</button>
      <button onClick={() => endSession()}>End Session</button>
    </div>
  );
}

describe('SessionContext', () => {
  describe('Provider and Hook', () => {
    it('provides context to child components', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Verify initial state
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('module')).toHaveTextContent('null');
      expect(screen.getByTestId('session-id')).toHaveTextContent('null');
      expect(screen.getByTestId('start-time')).toHaveTextContent('null');
    });

    it('throws error when useSession used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSession must be used within SessionProvider');

      console.error = originalError;
    });
  });

  describe('Session Lifecycle', () => {
    it('starts a session with module and sessionId', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Click start session
      fireEvent.click(screen.getByText('Start Session'));

      // Verify session started
      expect(screen.getByTestId('status')).toHaveTextContent('active');
      expect(screen.getByTestId('module')).toHaveTextContent('training');
      expect(screen.getByTestId('session-id')).toHaveTextContent('session-123');
      // startTime should be set (not null)
      expect(screen.getByTestId('start-time')).not.toHaveTextContent('null');
    });

    it('pauses an active session', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Start session first
      fireEvent.click(screen.getByText('Start Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');

      // Pause session
      fireEvent.click(screen.getByText('Pause Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('paused');
    });

    it('resumes a paused session', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Start and pause session
      fireEvent.click(screen.getByText('Start Session'));
      fireEvent.click(screen.getByText('Pause Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('paused');

      // Resume session
      fireEvent.click(screen.getByText('Resume Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');
    });

    it('ends a session', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Start session
      fireEvent.click(screen.getByText('Start Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');

      // End session
      fireEvent.click(screen.getByText('End Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('completed');

      // Verify module and sessionId preserved for telemetry
      expect(screen.getByTestId('module')).toHaveTextContent('training');
      expect(screen.getByTestId('session-id')).toHaveTextContent('session-123');
    });
  });

  describe('State Transition Validation', () => {
    it('warns when pausing a non-active session', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Try to pause idle session
      fireEvent.click(screen.getByText('Pause Session'));

      // Verify warning logged
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot pause session: session is not active');

      // Verify state unchanged
      expect(screen.getByTestId('status')).toHaveTextContent('idle');

      consoleWarnSpy.mockRestore();
    });

    it('warns when resuming a non-paused session', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Try to resume idle session
      fireEvent.click(screen.getByText('Resume Session'));

      // Verify warning logged
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot resume session: session is not paused');

      // Verify state unchanged
      expect(screen.getByTestId('status')).toHaveTextContent('idle');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    it('completes full session lifecycle: start → pause → resume → end', () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      );

      // Start session
      fireEvent.click(screen.getByText('Start Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');

      // Pause session
      fireEvent.click(screen.getByText('Pause Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('paused');

      // Resume session
      fireEvent.click(screen.getByText('Resume Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');

      // End session
      fireEvent.click(screen.getByText('End Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('completed');
    });
  });

  // Story 3.1: Training Session Tests
  describe('Training Session Features', () => {
    // Test component for training sessions
    function TrainingTestComponent() {
      const {
        state,
        startTrainingSession,
        nextDrill,
        recordDrillResult,
        endSession
      } = useSession();

      const handleStartTraining = () => {
        const drillQueue: DrillType[] = ['number_line', 'spatial_rotation', 'math_operations'];
        startTrainingSession('training-session-456', 'quick', drillQueue);
      };

      const handleNextDrill = () => {
        nextDrill();
      };

      const handleRecordResult = () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: true,
          timeToAnswer: 2500,
          accuracy: 100,
        };
        recordDrillResult(result);
      };

      return (
        <div>
          <div data-testid="status">{state.sessionStatus}</div>
          <div data-testid="module">{state.currentModule || 'null'}</div>
          <div data-testid="session-id">{state.sessionId || 'null'}</div>
          <div data-testid="session-type">{state.sessionType || 'null'}</div>
          <div data-testid="drill-queue">{state.drillQueue?.join(',') || 'null'}</div>
          <div data-testid="current-drill-index">{state.currentDrillIndex ?? 'null'}</div>
          <div data-testid="results-count">{state.results?.length ?? 0}</div>
          <button onClick={handleStartTraining}>Start Training</button>
          <button onClick={handleNextDrill}>Next Drill</button>
          <button onClick={handleRecordResult}>Record Result</button>
          <button onClick={() => endSession()}>End Session</button>
        </div>
      );
    }

    it('starts a training session with sessionType and drillQueue', () => {
      render(
        <SessionProvider>
          <TrainingTestComponent />
        </SessionProvider>
      );

      // Verify initial state
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('session-type')).toHaveTextContent('null');
      expect(screen.getByTestId('drill-queue')).toHaveTextContent('null');
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('null');

      // Start training session
      fireEvent.click(screen.getByText('Start Training'));

      // Verify training session started
      expect(screen.getByTestId('status')).toHaveTextContent('active');
      expect(screen.getByTestId('module')).toHaveTextContent('training');
      expect(screen.getByTestId('session-id')).toHaveTextContent('training-session-456');
      expect(screen.getByTestId('session-type')).toHaveTextContent('quick');
      expect(screen.getByTestId('drill-queue')).toHaveTextContent('number_line,spatial_rotation,math_operations');
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('0');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });

    it('advances to next drill when NEXT_DRILL action dispatched', () => {
      render(
        <SessionProvider>
          <TrainingTestComponent />
        </SessionProvider>
      );

      // Start training session
      fireEvent.click(screen.getByText('Start Training'));
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('0');

      // Advance to next drill
      fireEvent.click(screen.getByText('Next Drill'));
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('1');

      // Advance again
      fireEvent.click(screen.getByText('Next Drill'));
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('2');
    });

    it('records drill results when RECORD_DRILL_RESULT action dispatched', () => {
      render(
        <SessionProvider>
          <TrainingTestComponent />
        </SessionProvider>
      );

      // Start training session
      fireEvent.click(screen.getByText('Start Training'));
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');

      // Record first result
      fireEvent.click(screen.getByText('Record Result'));
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');

      // Record second result
      fireEvent.click(screen.getByText('Record Result'));
      expect(screen.getByTestId('results-count')).toHaveTextContent('2');
    });

    it('warns when advancing drill without training session', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <SessionProvider>
          <TrainingTestComponent />
        </SessionProvider>
      );

      // Try to advance drill without starting training session
      fireEvent.click(screen.getByText('Next Drill'));

      // Verify warning logged
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot advance drill: not in training session');

      // Verify state unchanged
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('null');

      consoleWarnSpy.mockRestore();
    });

    it('completes full training session: start → record results → advance drills → end', () => {
      render(
        <SessionProvider>
          <TrainingTestComponent />
        </SessionProvider>
      );

      // Start training session
      fireEvent.click(screen.getByText('Start Training'));
      expect(screen.getByTestId('status')).toHaveTextContent('active');
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('0');

      // Record result for first drill
      fireEvent.click(screen.getByText('Record Result'));
      expect(screen.getByTestId('results-count')).toHaveTextContent('1');

      // Advance to next drill
      fireEvent.click(screen.getByText('Next Drill'));
      expect(screen.getByTestId('current-drill-index')).toHaveTextContent('1');

      // Record result for second drill
      fireEvent.click(screen.getByText('Record Result'));
      expect(screen.getByTestId('results-count')).toHaveTextContent('2');

      // End session
      fireEvent.click(screen.getByText('End Session'));
      expect(screen.getByTestId('status')).toHaveTextContent('completed');

      // Verify session data preserved for telemetry
      expect(screen.getByTestId('session-id')).toHaveTextContent('training-session-456');
      expect(screen.getByTestId('results-count')).toHaveTextContent('2');
    });
  });
});
