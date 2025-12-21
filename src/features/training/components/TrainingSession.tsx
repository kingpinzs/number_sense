// TrainingSession - Main session orchestrator for training drills
// Story 3.1: Build Training Session Shell and State Management
// Story 3.2: Integrated NumberLineDrill rendering
// Story 3.6: Integrated confidence prompts and session completion
// Story 3.7: Added telemetry logging and atomic session persistence
// Manages drill queue, session lifecycle, and state

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { StreakCounter } from '@/shared/components/StreakCounter';
import { db, cleanOldSessions } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { useSession } from '@/context/SessionContext';
import { selectDrills, loadTrainingPlanWeights, type TrainingPlanWeights } from '@/services/training/drillSelector';
import type { DrillResult } from '@/services/storage/schemas';
import NumberLineDrill from '@/features/training/drills/NumberLineDrill';
import SpatialRotationDrill from '@/features/training/drills/SpatialRotationDrill';
import MathOperationsDrill from '@/features/training/drills/MathOperationsDrill';
import ConfidencePromptBefore from './ConfidencePromptBefore';
import ConfidencePromptAfter from './ConfidencePromptAfter';
import SessionCompletionSummary from './SessionCompletionSummary';
import SessionProgressBar from './SessionProgressBar';
import PauseButton from './PauseButton';
import SessionFeedback from './SessionFeedback';
import DrillTransition from './DrillTransition';
import { AnimatePresence } from 'framer-motion';
import { updateStreak } from '@/services/training/streakManager';
import {
  logSessionStart,
  logDrillComplete,
  logSessionEnd,
  logSessionPause,
  logSessionResume,
  restoreTelemetryBackup
} from '@/services/telemetry/logger';
// Story 4.2: Magic Minute imports
import { createSessionAnalyzer, type MistakePattern } from '@/services/adaptiveDifficulty/mistakeAnalyzer';
import {
  MagicMinuteTimer,
  useMagicMinuteTrigger,
  createMagicMinuteSession,
  updateMagicMinuteSession,
  type MagicMinuteSummary,
} from '@/features/magic-minute';

/**
 * TrainingSession component
 * Displays session header with date, streak, and "Start Training" button
 */
export default function TrainingSession() {
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [trainingWeights, setTrainingWeights] = useState<TrainingPlanWeights | null>(null);

  // Story 3.6: Confidence prompt and completion states
  const [showConfidenceBefore, setShowConfidenceBefore] = useState(false);
  const [showConfidenceAfter, setShowConfidenceAfter] = useState(false);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Story 3.5: UI component states
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastDrillCorrect, setLastDrillCorrect] = useState<boolean>(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string | number | undefined>(undefined);
  const [showTransition, setShowTransition] = useState(false);
  const [nextDrillType, setNextDrillType] = useState<'number_line' | 'spatial_rotation' | 'math_operations' | null>(null);

  // Story 4.2: Magic Minute state
  const [showMagicMinute, setShowMagicMinute] = useState(false);
  const [magicMinutePatterns, setMagicMinutePatterns] = useState<MistakePattern[]>([]);
  const [magicMinuteDbId, setMagicMinuteDbId] = useState<number | null>(null);
  const [sessionAnalyzer] = useState(() => createSessionAnalyzer());
  const { checkTrigger, acknowledge, reset: resetTrigger } = useMagicMinuteTrigger();

  const { state: sessionState, startTrainingSession, nextDrill, endSession, setConfidenceBefore, setConfidenceAfter, triggerMagicMinute, completeMagicMinute } = useSession();

  // Story 3.7: Initialize telemetry and database maintenance on mount
  useEffect(() => {
    async function initializeTelemetry() {
      try {
        // Restore any telemetry entries from localStorage backup
        const restoredCount = await restoreTelemetryBackup();
        if (restoredCount > 0) {
          console.log(`Restored ${restoredCount} telemetry entries from backup`);
        }

        // Clean old sessions (365 days retention)
        const cleanedCount = await cleanOldSessions(365);
        if (cleanedCount > 0) {
          console.log(`Cleaned ${cleanedCount} old sessions`);
        }
      } catch (error) {
        console.error('Error initializing telemetry:', error);
      }
    }

    initializeTelemetry();
  }, []);

  useEffect(() => {
    async function loadAssessmentAndWeights() {
      try {
        // Load latest assessment
        const latestAssessment = await db.assessments
          .orderBy('timestamp')
          .reverse()
          .first();

        if (latestAssessment) {
          // Load training plan weights
          const weights = await loadTrainingPlanWeights();
          setTrainingWeights(weights);

          // Determine session goal based on highest weight
          const domainGoals = {
            numberSense: 'Number Sense',
            spatial: 'Spatial Awareness',
            operations: 'Math Operations',
          };

          // Find domain with highest weight
          const highestDomain = Object.entries(weights)
            .reduce((max, [domain, weight]) =>
              weight > max.weight ? { domain, weight } : max,
              { domain: 'numberSense', weight: 0 }
            ).domain as keyof TrainingPlanWeights;

          setSessionGoal(domainGoals[highestDomain]);
        }
      } catch (error) {
        console.error('Error loading assessment and weights:', error);
      }
    }

    loadAssessmentAndWeights();
  }, []);

  // Auto-skip unimplemented drill types
  // Story 3.2: number_line implemented
  // Story 3.3: spatial_rotation implemented
  useEffect(() => {
    if (sessionState.sessionStatus === 'active' &&
        sessionState.drillQueue &&
        sessionState.currentDrillIndex !== undefined) {
      const currentDrillType = sessionState.drillQueue[sessionState.currentDrillIndex];
      const implementedTypes = ['number_line', 'spatial_rotation', 'math_operations'];

      if (!implementedTypes.includes(currentDrillType)) {
        console.log(`Skipping unimplemented drill type: ${currentDrillType}`);
        if (sessionState.currentDrillIndex < sessionState.drillQueue.length - 1) {
          nextDrill();
        } else {
          endSession();
        }
      }
    }
  }, [sessionState.sessionStatus, sessionState.currentDrillIndex, sessionState.drillQueue, nextDrill, endSession]);

  const handleStartTraining = async () => {
    // Ensure we have training weights loaded
    if (!trainingWeights) {
      console.error('Training weights not loaded');
      return;
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Select drills using loaded training weights
    const drillQueue = await selectDrills(trainingWeights, 6); // Quick session = 6 drills

    // Start training session in context with drill queue
    startTrainingSession(sessionId, 'quick', drillQueue);

    // Story 4.2: Reset Magic Minute state for new session
    resetTrigger();
    sessionAnalyzer.reset();

    // Record session start time for duration calculation
    setSessionStartTime(Date.now());

    // Story 3.6: Show confidence before prompt
    setShowConfidenceBefore(true);

    // Story 3.7: Persist session to Dexie and log telemetry
    try {
      await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'training',
        duration: 0,
        completionStatus: 'paused', // Will update to 'completed' when session ends
        sessionType: 'quick',
        drillQueue: drillQueue,  // Store drill queue for session resume capability
      });

      // Log session start telemetry
      await logSessionStart(sessionId, 'quick', drillQueue.length);

      console.log('Training session persisted to Dexie:', { sessionId, drillQueue });
    } catch (error) {
      console.error('Failed to persist session:', error);

      // Show user-friendly toast notification
      toast.error('Session data not saved', {
        description: 'Your progress may not be recorded. Please check your browser storage settings.'
      });

      // Fallback to localStorage backup if Dexie fails
      localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
        module: 'training',
        sessionType: 'quick',
        drillQueue: drillQueue,
      }));
    }
  };

  const handleDrillComplete = async (result: DrillResult) => {
    // Story 3.2: Handle drill completion and advance to next drill
    console.log('Drill completed:', result);

    // Story 3.7: Log drill completion telemetry
    await logDrillComplete(result.module, {
      accuracy: result.accuracy,
      difficulty: result.difficulty,
      isCorrect: result.isCorrect,
      timeToAnswer: result.timeToAnswer
    });

    // Story 4.2: Feed result to session analyzer for mistake tracking
    const analysisResult = sessionAnalyzer.addDrillResult(result);
    const drillNumber = (sessionState.currentDrillIndex ?? 0) + 1;

    // Check if Magic Minute should trigger
    if (analysisResult && analysisResult.patterns.length > 0) {
      const triggered = checkTrigger(drillNumber, analysisResult.patterns);
      if (triggered) {
        setMagicMinutePatterns(analysisResult.patterns);
        triggerMagicMinute(analysisResult.patterns);

        // Create Magic Minute session in database
        // Note: sessionState.sessionId is a UUID string, but MagicMinuteSession expects a number.
        // Use timestamp-based ID as fallback since UUID parsing returns NaN.
        // TODO: Refactor to capture Dexie's auto-generated session ID at session start.
        const numericSessionId = Date.now();
        const targetedMistakes = analysisResult.patterns.map(p => p.patternType);
        const dbId = await createMagicMinuteSession(numericSessionId, targetedMistakes);
        if (dbId) setMagicMinuteDbId(dbId);

        setShowMagicMinute(true);
        acknowledge();
        return; // Don't proceed to next drill until Magic Minute completes
      }
    }

    // Story 3.5: Show feedback for 1.5s before advancing
    setLastDrillCorrect(result.isCorrect);
    setLastCorrectAnswer(result.correctAnswer);
    setShowFeedback(true);

    // Wait 1.5s for feedback display
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowFeedback(false);

    // Check if there are more drills in the queue
    if (sessionState.currentDrillIndex !== undefined &&
        sessionState.drillQueue &&
        sessionState.currentDrillIndex < sessionState.drillQueue.length - 1) {
      // Story 3.5: Show transition for 0.5s before next drill
      const nextIndex = sessionState.currentDrillIndex + 1;
      const nextType = sessionState.drillQueue[nextIndex];
      setNextDrillType(nextType as any);
      setShowTransition(true);

      await new Promise(resolve => setTimeout(resolve, 500));
      setShowTransition(false);

      // Advance to next drill
      nextDrill();
    } else {
      // No more drills - Story 3.6: Show confidence after prompt
      endSession();
      setShowConfidenceAfter(true);
    }
  };

  // Story 3.6: Handle confidence before selection
  const handleConfidenceBeforeSelect = (confidence: number) => {
    setConfidenceBefore(confidence);
    setShowConfidenceBefore(false);
    // Session can now proceed to first drill
  };

  // Story 3.6: Handle confidence after selection
  // Story 3.7: Enhanced with atomic writes and telemetry logging
  const handleConfidenceAfterSelect = async (confidence: number) => {
    setConfidenceAfter(confidence);
    setShowConfidenceAfter(false);

    // Calculate session stats
    const drillCount = sessionState.drillQueue?.length || 0;
    const results = sessionState.results || [];
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = drillCount > 0 ? Math.round((correctCount / drillCount) * 100) : 0;
    const duration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const confidenceChange = sessionState.confidenceBefore
      ? confidence - sessionState.confidenceBefore
      : null;

    // Calculate drillTypes distribution (Story 3.7)
    const drillTypeCounts = (sessionState.drillQueue || []).reduce((acc, drillType) => {
      if (drillType === 'number_line') acc.number_line++;
      else if (drillType === 'spatial_rotation') acc.spatial_rotation++;
      else if (drillType === 'math_operations') acc.math_operations++;
      return acc;
    }, { number_line: 0, spatial_rotation: 0, math_operations: 0 });

    // Update streak
    const newStreak = updateStreak();
    console.log('Streak updated:', newStreak);

    // Story 3.7: Persist session completion with atomic transaction
    try {
      // Find the session we created at start
      const sessions = await db.sessions
        .filter(s => s.module === 'training' && s.completionStatus === 'paused')
        .reverse()
        .limit(1)
        .toArray();

      if (sessions.length > 0) {
        const sessionId = sessions[0].id;

        // Use transaction for atomic update
        await db.transaction('rw', [db.sessions], async () => {
          await db.sessions.update(sessionId!, {
            completionStatus: 'completed',
            duration,
            drillCount,
            accuracy,
            confidenceBefore: sessionState.confidenceBefore || undefined,
            confidenceAfter: confidence,
            confidenceChange: confidenceChange || undefined,
          });
        });

        // Log session end telemetry
        await logSessionEnd({
          accuracy,
          duration,
          confidenceChange,
          drillCount
        });

        console.log('Session completed and persisted:', {
          sessionId,
          drillCount,
          accuracy,
          drillTypes: drillTypeCounts
        });
      }
    } catch (error) {
      console.error('Failed to update session:', error);

      // Show user-friendly toast notification
      toast.error('Session data not saved', {
        description: 'Your progress may not be recorded. Please check your browser storage settings.'
      });

      // Fallback: save to localStorage with namespaced key
      localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
        timestamp: new Date().toISOString(),
        drillCount,
        accuracy,
        confidenceBefore: sessionState.confidenceBefore,
        confidenceAfter: confidence,
        confidenceChange,
        duration,
        drillTypes: drillTypeCounts
      }));
    }

    // Show completion summary
    setShowCompletionSummary(true);
  };

  // Story 4.2: Handle Magic Minute completion
  const handleMagicMinuteComplete = async (summary: MagicMinuteSummary) => {
    console.log('Magic Minute completed:', summary);

    // Update Magic Minute session in database
    if (magicMinuteDbId) {
      await updateMagicMinuteSession(magicMinuteDbId, summary);
    }

    // Update context state
    completeMagicMinute();

    // Hide Magic Minute overlay
    setShowMagicMinute(false);
    setMagicMinutePatterns([]);
    setMagicMinuteDbId(null);

    // Continue to next drill (show feedback first if applicable)
    if (sessionState.currentDrillIndex !== undefined &&
        sessionState.drillQueue &&
        sessionState.currentDrillIndex < sessionState.drillQueue.length - 1) {
      // Show transition then advance
      const nextIndex = sessionState.currentDrillIndex + 1;
      const nextType = sessionState.drillQueue[nextIndex];
      setNextDrillType(nextType as any);
      setShowTransition(true);

      await new Promise(resolve => setTimeout(resolve, 500));
      setShowTransition(false);

      nextDrill();
    } else {
      // No more drills - show confidence after prompt
      endSession();
      setShowConfidenceAfter(true);
    }
  };

  // Story 3.5: Handle pause button actions
  // Story 3.7: Enhanced with telemetry logging
  const handlePauseResume = async () => {
    // Session context already handles pause/resume state
    // This callback is for PauseButton to trigger on resume
    console.log('Session resumed');

    // Log session resume telemetry
    await logSessionResume();
  };

  const handlePauseEndSession = async () => {
    // Log session pause before ending
    if (sessionState.currentDrillIndex !== undefined) {
      await logSessionPause(sessionState.currentDrillIndex);
    }

    endSession();
    setShowConfidenceAfter(true);
  };

  // Story 3.2: Render active drill when session is active
  // Story 3.6: Don't render drills while confidence before prompt is shown
  if (sessionState.sessionStatus === 'active' &&
      sessionState.drillQueue &&
      sessionState.currentDrillIndex !== undefined &&
      !showConfidenceBefore) {
    const currentDrillType = sessionState.drillQueue[sessionState.currentDrillIndex];
    const drillIndex = sessionState.currentDrillIndex;

    // Story 3.2: number_line implemented
    // Story 3.3: spatial_rotation implemented
    // Show loading state while auto-skipping unimplemented drill types
    const implementedTypes = ['number_line', 'spatial_rotation', 'math_operations'];
    if (!implementedTypes.includes(currentDrillType)) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading next drill...</p>
        </div>
      );
    }

    // Calculate difficulty based on drill index (Story 3.2 AC-4)
    // First 2 drills: Easy
    // Next 3 drills: Medium
    // Remaining: Hard (TODO: check accuracy > 80%)
    let difficulty: 'easy' | 'medium' | 'hard';
    if (drillIndex < 2) {
      difficulty = 'easy';
    } else if (drillIndex < 5) {
      difficulty = 'medium';
    } else {
      difficulty = 'hard';
    }

    // Story 3.5: Wrap drill with UI components
    return (
      <>
        {/* Story 3.5: Session Progress Bar and Pause Button */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Training Session</h2>
              <PauseButton
                currentDrill={drillIndex + 1}
                totalDrills={sessionState.drillQueue.length}
                onResume={handlePauseResume}
                onEndSession={handlePauseEndSession}
              />
            </div>
            <SessionProgressBar
              currentIndex={drillIndex}
              totalDrills={sessionState.drillQueue.length}
            />
          </div>
        </div>

        {/* Render drill based on type */}
        {/* TODO: sessionId should be Dexie's auto-generated numeric ID, not parsed UUID */}
        {currentDrillType === 'number_line' && (
          <NumberLineDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'spatial_rotation' && (
          <SpatialRotationDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'math_operations' && (
          <MathOperationsDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={0}
            onComplete={handleDrillComplete}
          />
        )}

        {/* Story 3.5: Feedback overlay */}
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
            <SessionFeedback
              isCorrect={lastDrillCorrect}
              correctAnswer={lastCorrectAnswer}
              showStreakPulse={false}
            />
          </div>
        )}

        {/* Story 3.5: Drill transition overlay */}
        <AnimatePresence>
          {showTransition && nextDrillType && (
            <DrillTransition nextDrillType={nextDrillType} />
          )}
        </AnimatePresence>

        {/* Story 4.2: Magic Minute overlay */}
        {showMagicMinute && magicMinutePatterns.length > 0 && (
          <MagicMinuteTimer
            mistakePatterns={magicMinutePatterns}
            sessionId={0}
            onComplete={handleMagicMinuteComplete}
          />
        )}
      </>
    );
  }

  // Default: Show session setup screen
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex h-screen max-w-4xl flex-col">
        {/* Header */}
        <div className="border-b bg-background p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Training</h1>
            <StreakCounter />
          </div>

          {/* Date display */}
          <p className="mt-2 text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>

          {/* Session goal */}
          {sessionGoal && (
            <p className="mt-1 text-sm font-medium text-primary">
              Focus: {sessionGoal}
            </p>
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ready to Train?</CardTitle>
              <CardDescription>
                Start your personalized training session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Based on your assessment, we've created a personalized training plan to help strengthen your skills.
              </p>

              {/* Session type selection (optional for v1) */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Session Type:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                    <span className="font-semibold">Quick</span>
                    <span className="text-xs text-muted-foreground">5 min</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-1 py-3">
                    <span className="font-semibold">Full</span>
                    <span className="text-xs text-muted-foreground">15 min</span>
                  </Button>
                </div>
              </div>

              {/* Start Training Button */}
              <Button
                onClick={handleStartTraining}
                className="w-full min-h-[44px] bg-primary hover:bg-primary/90"
                disabled={sessionState.sessionStatus === 'active'}
                data-testid="start-training-button"
              >
                Start Training
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Story 3.6: Confidence prompts and completion summary */}
      <ConfidencePromptBefore
        isOpen={showConfidenceBefore}
        onSelect={handleConfidenceBeforeSelect}
      />

      <ConfidencePromptAfter
        isOpen={showConfidenceAfter}
        onSelect={handleConfidenceAfterSelect}
      />

      <SessionCompletionSummary
        isOpen={showCompletionSummary}
        drillCount={sessionState.drillQueue?.length || 0}
        accuracy={(() => {
          const results = sessionState.results || [];
          const correct = results.filter(r => r.isCorrect).length;
          const total = results.length;
          return total > 0 ? Math.round((correct / total) * 100) : 0;
        })()}
        confidenceChange={sessionState.confidenceChange || null}
      />
    </div>
  );
}
