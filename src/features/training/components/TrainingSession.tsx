// TrainingSession - Main session orchestrator for training drills
// Story 3.1: Build Training Session Shell and State Management
// Story 3.2: Integrated NumberLineDrill rendering
// Story 3.6: Integrated confidence prompts and session completion
// Story 3.7: Added telemetry logging and atomic session persistence
// Manages drill queue, session lifecycle, and state

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { StreakCounter } from '@/shared/components/StreakCounter';
import { db, cleanOldSessions } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import { useSession } from '@/context/SessionContext';
import { selectDrills, loadTrainingPlanWeights, type TrainingPlanWeights, type DrillType } from '@/services/training/drillSelector';
import type { DrillResult } from '@/services/storage/schemas';
import NumberLineDrill from '@/features/training/drills/NumberLineDrill';
import SpatialRotationDrill from '@/features/training/drills/SpatialRotationDrill';
import MathOperationsDrill from '@/features/training/drills/MathOperationsDrill';
import SubitizingDrill from '@/features/training/drills/SubitizingDrill';
import NumberBondsDrill from '@/features/training/drills/NumberBondsDrill';
import MagnitudeComparisonDrill from '@/features/training/drills/MagnitudeComparisonDrill';
import PlaceValueDrill from '@/features/training/drills/PlaceValueDrill';
import EstimationDrill from '@/features/training/drills/EstimationDrill';
import SequencingDrill from '@/features/training/drills/SequencingDrill';
import FactFluencyDrill from '@/features/training/drills/FactFluencyDrill';
import FractionsDrill from '@/features/training/drills/FractionsDrill';
import TimeMeasurementDrill from '@/features/training/drills/TimeMeasurementDrill';
import WorkingMemoryDrill from '@/features/training/drills/WorkingMemoryDrill';
import RhythmicCountingDrill from '@/features/training/drills/RhythmicCountingDrill';
import MentalMathStrategyDrill from '@/features/training/drills/MentalMathStrategyDrill';
import FactFamilyDrill from '@/features/training/drills/FactFamilyDrill';
import EverydayMathDrill from '@/features/training/drills/EverydayMathDrill';
import NumberDecompositionDrill from '@/features/training/drills/NumberDecompositionDrill';
import ConfidencePromptBefore from './ConfidencePromptBefore';
import ConfidencePromptAfter from './ConfidencePromptAfter';
import SessionCompletionSummary from './SessionCompletionSummary';
import SessionProgressBar from './SessionProgressBar';
import PauseButton from './PauseButton';
import SessionFeedback from './SessionFeedback';
import DrillTransition from './DrillTransition';
import { AnimatePresence } from 'framer-motion';
import { updateStreak } from '@/services/training/streakManager';
import { analyzePerformance } from '@/services/training/insightEngine';
import type { InsightEngineResult } from '@/services/training/insightTypes';
import { calculateInsightWeightAdjustments, applyInsightWeightAdjustments } from '@/services/training/insightWeighting';
import SuggestedPractice from './SuggestedPractice';
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
  useTransparencyToast,
  type MagicMinuteSummary,
} from '@/features/magic-minute';
// Story 4.4: Adaptive difficulty imports
import { processSessionEnd } from '@/services/adaptiveDifficulty/difficultyEngine';
import { useUserSettings } from '@/context/UserSettingsContext';

/**
 * All drill types that have a corresponding React component.
 * Used by both the auto-skip useEffect and the render guard to ensure
 * they never diverge — any new drill implementation should be added here.
 */
const IMPLEMENTED_DRILL_TYPES: ReadonlySet<string> = new Set([
  'number_line', 'spatial_rotation', 'math_operations', 'subitizing', 'number_bonds',
  'magnitude_comparison', 'place_value', 'estimation', 'sequencing', 'fact_fluency',
  'fractions', 'time_measurement', 'working_memory',
  'rhythmic_counting', 'mental_math_strategy', 'fact_family', 'everyday_math', 'number_decomposition',
]);

/**
 * TrainingSession component
 * Displays session header with date, streak, and "Start Training" button
 */
export default function TrainingSession() {
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [trainingWeights, setTrainingWeights] = useState<TrainingPlanWeights | null>(null);
  // Store the original assessment-derived weights so insight adjustments can be re-applied
  // from the base without double-applying multipliers after session completion.
  const baseWeightsRef = useRef<TrainingPlanWeights | null>(null);
  const [weightsLoading, setWeightsLoading] = useState(true);
  const [selectedSessionType, setSelectedSessionType] = useState<'quick' | 'full'>('quick');

  // InsightEngine state
  const [insightResult, setInsightResult] = useState<InsightEngineResult | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Focused practice: difficulty override from SuggestedPractice drill selection
  const [focusedDifficulty, setFocusedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);

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
  const [nextDrillType, setNextDrillType] = useState<string | null>(null);

  // Dexie auto-generated session ID for drill foreign keys
  const [dbSessionId, setDbSessionId] = useState<number | null>(null);

  // Story 3.4: Track used problems across drills to prevent duplicates within a session
  const usedProblemsRef = useRef(new Set<string>());

  // Story 4.2: Magic Minute state
  const [showMagicMinute, setShowMagicMinute] = useState(false);
  const [magicMinutePatterns, setMagicMinutePatterns] = useState<MistakePattern[]>([]);
  const [magicMinuteDbId, setMagicMinuteDbId] = useState<number | null>(null);
  const [sessionAnalyzer] = useState(() => createSessionAnalyzer());
  const { checkTrigger, acknowledge, reset: resetTrigger } = useMagicMinuteTrigger();

  // Story 4.5: TransparencyToast displays messages like "Difficulty increased because you're doing great!"
  const { showTransparencyToast } = useTransparencyToast();

  const { settings } = useUserSettings();
  const { state: sessionState, startTrainingSession, nextDrill, recordDrillResult, endSession, setConfidenceBefore, setConfidenceAfter, triggerMagicMinute, completeMagicMinute } = useSession();

  // Story 3.7: Initialize telemetry and database maintenance on mount
  useEffect(() => {
    async function initializeTelemetry() {
      try {
        // Restore any telemetry entries from localStorage backup
        await restoreTelemetryBackup();
        await cleanOldSessions(365);
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
          baseWeightsRef.current = weights;
          setTrainingWeights(weights);

          // Determine session goal based on highest weight
          const domainGoals: Record<string, string> = {
            numberSense: 'Number Sense',
            placeValue: 'Place Value',
            sequencing: 'Sequencing',
            arithmetic: 'Arithmetic',
            spatial: 'Spatial Reasoning',
            applied: 'Applied Math',
          };

          // Find domain with highest weight
          const highestDomain = Object.entries(weights)
            .reduce((max, [domain, weight]) =>
              weight > max.weight ? { domain, weight } : max,
              { domain: 'numberSense', weight: 0 }
            ).domain;

          setSessionGoal(domainGoals[highestDomain] ?? 'Training');
        }
      // Run InsightEngine analysis (non-blocking)
      try {
        const result = await analyzePerformance();
        setInsightResult(result);

        // Apply insight-derived weight adjustments to drill selection weights
        // Always adjust from base weights to avoid double-applying multipliers
        if (result.hasEnoughData && result.domainPerformance.length > 0) {
          const adjustments = calculateInsightWeightAdjustments(result.domainPerformance);
          const base = baseWeightsRef.current;
          if (base) {
            setTrainingWeights(applyInsightWeightAdjustments(base, adjustments));
          }
        }
      } catch (insightError) {
        console.error('Error running insight analysis:', insightError);
        // Non-critical — don't show error toast, just skip insights
      } finally {
        setInsightLoading(false);
      }

      } catch (error) {
        console.error('Error loading assessment and weights:', error);
        toast.error('Failed to load training data', {
          description: 'Please try again or retake the assessment.',
        });
      } finally {
        setWeightsLoading(false);
        setInsightLoading(false);
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

      if (!IMPLEMENTED_DRILL_TYPES.has(currentDrillType)) {
        if (sessionState.currentDrillIndex < sessionState.drillQueue.length - 1) {
          nextDrill();
        } else {
          endSession();
        }
      }
    }
  }, [sessionState.sessionStatus, sessionState.currentDrillIndex, sessionState.drillQueue, nextDrill, endSession]);

  const handleStartTraining = async () => {
    // Clear any stale focused difficulty from a previously abandoned focused session
    setFocusedDifficulty(null);

    // Ensure we have training weights loaded
    if (!trainingWeights) {
      toast.error('Training data still loading', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    // Select drills: Quick = 6, Full = 12
    const drillCount = selectedSessionType === 'quick' ? 6 : 12;
    const drillQueue = await selectDrills(trainingWeights, drillCount);

    // Story 3.4: Reset used problems tracking for new session
    usedProblemsRef.current = new Set<string>();

    // Story 4.2: Reset Magic Minute state for new session
    resetTrigger();
    sessionAnalyzer.reset();

    // Record session start time for duration calculation
    setSessionStartTime(Date.now());

    // Story 3.6: Show confidence before prompt
    setShowConfidenceBefore(true);

    // Persist session to Dexie FIRST to get numeric ID (consistent numeric IDs per Epic 5 retro)
    try {
      const newDbId = await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'training',
        duration: 0,
        completionStatus: 'paused', // Will update to 'completed' when session ends
        sessionType: selectedSessionType,
        drillQueue: drillQueue,  // Store drill queue for session resume capability
      });
      const sessionId = newDbId as number;
      setDbSessionId(sessionId);

      // Start training session in context with Dexie's numeric ID
      startTrainingSession(sessionId, selectedSessionType, drillQueue);

      // Log session start telemetry
      await logSessionStart(sessionId, 'quick', drillQueue.length);
    } catch (error) {
      console.error('Failed to persist session:', error);

      // Show user-friendly toast notification
      toast.error('Session data not saved', {
        description: 'Your progress may not be recorded. Please check your browser storage settings.'
      });

      // Fallback: use timestamp-based numeric ID and start context
      const fallbackId = Date.now();
      setDbSessionId(fallbackId);
      startTrainingSession(fallbackId, selectedSessionType, drillQueue);

      // Fallback to localStorage backup if Dexie fails
      localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify({
        sessionId: fallbackId,
        timestamp: new Date().toISOString(),
        module: 'training',
        sessionType: selectedSessionType,
        drillQueue: drillQueue,
      }));
    }
  };

  // Handle drill selection from SuggestedPractice — starts a single-drill quick session
  const handleDrillSelect = async (drillType: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!IMPLEMENTED_DRILL_TYPES.has(drillType)) {
      toast.error('This drill is not yet available');
      return;
    }
    setFocusedDifficulty(difficulty);
    // Defensive: dismiss confidence-before prompt if somehow open
    setShowConfidenceBefore(false);
    // Build a single-drill queue with the selected type repeated 3 times for focused practice
    const drillQueue = [drillType, drillType, drillType] as DrillType[];

    // Reset session state
    usedProblemsRef.current = new Set<string>();
    resetTrigger();
    sessionAnalyzer.reset();
    setSessionStartTime(Date.now());

    // Skip confidence prompt for focused practice — go straight to drills
    try {
      const newDbId = await db.sessions.add({
        timestamp: new Date().toISOString(),
        module: 'training',
        duration: 0,
        completionStatus: 'paused',
        sessionType: 'quick',
        drillQueue,
      });
      const sessionId = newDbId as number;
      setDbSessionId(sessionId);
      startTrainingSession(sessionId, 'quick', drillQueue);
      await logSessionStart(sessionId, 'quick', drillQueue.length);
    } catch (error) {
      console.error('Failed to persist focused session:', error);
      const fallbackId = Date.now();
      setDbSessionId(fallbackId);
      startTrainingSession(fallbackId, 'quick', drillQueue);
    }
  };

  const handleDrillComplete = async (result: DrillResult) => {
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

    // Check if Magic Minute (Boost Round) should trigger — respects user setting
    if (settings.magicMinuteEnabled && analysisResult && analysisResult.patterns.length > 0) {
      const triggered = checkTrigger(drillNumber, analysisResult.patterns);
      if (triggered) {
        setMagicMinutePatterns(analysisResult.patterns);
        triggerMagicMinute(analysisResult.patterns);

        // Create Magic Minute session in database using Dexie's auto-generated ID
        const targetedMistakes = analysisResult.patterns.map(p => p.patternType);
        const dbId = await createMagicMinuteSession(dbSessionId ?? 0, targetedMistakes);
        if (dbId) setMagicMinuteDbId(dbId);

        setShowMagicMinute(true);
        acknowledge();
        return; // Don't proceed to next drill until Magic Minute completes
      }
    }

    // Record drill result in session state for accuracy tracking
    recordDrillResult(result);

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
      setNextDrillType(nextType);
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
    const results = sessionState.results || [];
    const drillCount = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = drillCount > 0 ? Math.round((correctCount / drillCount) * 100) : 0;
    const duration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const confidenceChange = sessionState.confidenceBefore
      ? confidence - sessionState.confidenceBefore
      : null;

    // Calculate drillTypes distribution (Story 3.7)
    const drillTypeCounts = results.reduce((acc, r) => {
      acc[r.module] = (acc[r.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Update streak
    updateStreak();

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

        // Story 4.4: Calculate and apply difficulty adjustments
        // Story 4.5: Show transparency toast for adjustments
        if (sessionId) {
          try {
            const adjustments = await processSessionEnd(sessionId);
            if (adjustments.length > 0) {
              showTransparencyToast(adjustments);
            }
          } catch (adjustmentError) {
            console.error('Failed to process difficulty adjustments:', adjustmentError);
            // Non-critical - don't fail session completion
          }
        }

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

    // Clear focused difficulty override when session ends
    setFocusedDifficulty(null);

    // Refresh insights with new drill data from the completed session
    try {
      const refreshedInsights = await analyzePerformance();
      setInsightResult(refreshedInsights);

      // Re-apply weight adjustments from base weights so the next session
      // uses updated domain performance data (not stale initial load data)
      if (refreshedInsights.hasEnoughData && refreshedInsights.domainPerformance.length > 0) {
        const weightAdjustments = calculateInsightWeightAdjustments(refreshedInsights.domainPerformance);
        const base = baseWeightsRef.current;
        if (base) {
          setTrainingWeights(applyInsightWeightAdjustments(base, weightAdjustments));
        }
      }
    } catch (insightError) {
      console.error('Failed to refresh insights after session:', insightError);
    }

    // Show completion summary
    setShowCompletionSummary(true);
  };

  // Story 4.2: Handle Magic Minute completion
  const handleMagicMinuteComplete = async (summary: MagicMinuteSummary) => {
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
      setNextDrillType(nextType);
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

    // Show loading state while auto-skipping unimplemented drill types
    if (!IMPLEMENTED_DRILL_TYPES.has(currentDrillType)) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading next drill...</p>
        </div>
      );
    }

    // Calculate difficulty based on focused practice override, drill index, or performance
    let difficulty: 'easy' | 'medium' | 'hard';
    if (focusedDifficulty) {
      // Use difficulty selected from SuggestedPractice for focused practice sessions
      difficulty = focusedDifficulty;
    } else if (drillIndex < 2) {
      difficulty = 'easy';
    } else if (drillIndex < 5) {
      difficulty = 'medium';
    } else {
      const results = sessionState.results || [];
      const correctCount = results.filter(r => r.isCorrect).length;
      const currentAccuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;
      difficulty = currentAccuracy > 80 ? 'hard' : 'medium';
    }

    // Story 3.5: Wrap drill with UI components
    return (
      <>
        {/* Story 3.5: Session Progress Bar and Pause Button */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-background border-b shadow-sm">
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
        {currentDrillType === 'number_line' && (
          <NumberLineDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'spatial_rotation' && (
          <SpatialRotationDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'math_operations' && (
          <MathOperationsDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
            usedProblems={usedProblemsRef.current}
          />
        )}

        {currentDrillType === 'subitizing' && (
          <SubitizingDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'number_bonds' && (
          <NumberBondsDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'magnitude_comparison' && (
          <MagnitudeComparisonDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'place_value' && (
          <PlaceValueDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'estimation' && (
          <EstimationDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'sequencing' && (
          <SequencingDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'fact_fluency' && (
          <FactFluencyDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'fractions' && (
          <FractionsDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'time_measurement' && (
          <TimeMeasurementDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'working_memory' && (
          <WorkingMemoryDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'rhythmic_counting' && (
          <RhythmicCountingDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'mental_math_strategy' && (
          <MentalMathStrategyDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'fact_family' && (
          <FactFamilyDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'everyday_math' && (
          <EverydayMathDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {currentDrillType === 'number_decomposition' && (
          <NumberDecompositionDrill
            key={`drill-${drillIndex}`}
            difficulty={difficulty}
            sessionId={dbSessionId ?? 0}
            onComplete={handleDrillComplete}
          />
        )}

        {/* Story 3.5: Feedback overlay */}
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
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
            sessionId={dbSessionId ?? 0}
            onComplete={handleMagicMinuteComplete}
          />
        )}
      </>
    );
  }

  // Default: Show session setup screen
  return (
    <div className="bg-background pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col">
        {/* Header */}
        <div className="border-b bg-background px-6 py-3">
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

        {/* Main content: Session card + SuggestedPractice */}
        <div className="p-6">
          <div className="mx-auto max-w-md">
            <Card className="w-full">
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

                {/* Session type selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Session Type:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSessionType === 'quick' ? 'default' : 'outline'}
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => setSelectedSessionType('quick')}
                      data-testid="session-type-quick"
                    >
                      <span className="font-semibold">Quick</span>
                      <span className="text-xs opacity-70">6 drills</span>
                    </Button>
                    <Button
                      variant={selectedSessionType === 'full' ? 'default' : 'outline'}
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => setSelectedSessionType('full')}
                      data-testid="session-type-full"
                    >
                      <span className="font-semibold">Full</span>
                      <span className="text-xs opacity-70">12 drills</span>
                    </Button>
                  </div>
                </div>

                {/* Start Training Button */}
                <Button
                  onClick={handleStartTraining}
                  className="w-full min-h-[44px] bg-primary hover:bg-primary/90"
                  disabled={weightsLoading || sessionState.sessionStatus === 'active'}
                  data-testid="start-training-button"
                >
                  {weightsLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Preparing your session…
                    </span>
                  ) : 'Start Training'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suggested Practice: Insights, weakness-first drills, domain progress, all drills */}
        <SuggestedPractice
          result={insightResult}
          loading={insightLoading}
          onDrillSelect={handleDrillSelect}
        />
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
