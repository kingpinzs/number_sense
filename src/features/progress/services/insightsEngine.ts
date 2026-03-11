// Insights Generation Engine - Story 5.4
// @deprecated — Use analyzePerformance() from @/services/training/insightEngine instead.
// This file is kept for reference and backward compatibility with its exported types.
// The useInsights hook now delegates to the unified InsightEngine.
// Analyzes session data to generate personalized progress insights
// Architecture: Pure functions for insight generation, no side effects

import { subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import type { Session, DrillResult } from '@/services/storage/schemas';

// --- Type Definitions ---

export type InsightCategory = 'milestone' | 'concern' | 'positive' | 'general';

export interface Insight {
  id: string;
  category: InsightCategory;
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    route: string;
  };
  priority: number;
}

export type TrendDirection = 'improving' | 'stable' | 'declining';

const MODULE_DISPLAY_NAMES: Record<string, string> = {
  'number_line': 'Number Line',
  'spatial_rotation': 'Spatial Rotation',
  'math_operations': 'Math Operations',
  'subitizing': 'Quick Count',
  'number_bonds': 'Number Bonds',
  'magnitude_comparison': 'Number Comparison',
  'place_value': 'Place Value',
  'estimation': 'Estimation',
  'sequencing': 'Sequencing',
  'fact_fluency': 'Fact Fluency',
  'fractions': 'Fractions',
  'time_measurement': 'Time & Measurement',
  'working_memory': 'Working Memory',
};

const MAX_INSIGHTS = 5;
const MIN_SESSIONS_FOR_INSIGHTS = 3;

// --- Statistical Significance ---

/**
 * Critical t-values at p=0.10 (two-tailed) by degrees of freedom.
 * Used to validate that observed trends are statistically meaningful,
 * not just noise in small samples. p=0.10 is appropriate for educational
 * data with small sample sizes (3-10 sessions).
 *
 * Source: Student's t-distribution table
 */
const T_CRITICAL_P10: Record<number, number> = {
  1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015,
  6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812,
};

function getCriticalT(df: number): number {
  if (df <= 0) return Infinity;
  if (df <= 10) return T_CRITICAL_P10[df] ?? T_CRITICAL_P10[10];
  return 1.645; // z-approximation for large samples
}

/**
 * Test whether a regression slope is statistically significant.
 * Uses a t-test on the slope coefficient: t = slope / SE(slope)
 * where SE = sqrt(SSR/(n-2)) / sqrt(SSX)
 */
function isSlopeSignificant(
  values: number[],
  slope: number,
  n: number,
): boolean {
  const xMean = (n - 1) / 2; // mean of [0, 1, ..., n-1]
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  const intercept = yMean - slope * xMean;

  let SSR = 0; // Sum of squared residuals
  let SSX = 0; // Sum of squared deviations of x from mean
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    SSR += (values[i] - predicted) ** 2;
    SSX += (i - xMean) ** 2;
  }

  const df = n - 2;
  if (df <= 0 || SSX === 0) return false;

  // Perfect fit (SSR=0) with non-zero slope is always significant
  if (SSR === 0) return Math.abs(slope) > 0;

  const SE = Math.sqrt(SSR / df) / Math.sqrt(SSX);
  if (!Number.isFinite(SE) || SE === 0) return Math.abs(slope) > 0;

  const tStat = Math.abs(slope / SE);
  return tStat > getCriticalT(df);
}

// --- Trend Detection ---

/**
 * Detect trend direction using linear regression with statistical significance.
 * Requires BOTH practical significance (slope > threshold) AND statistical
 * significance (t-test at p=0.10) before reporting a trend. This prevents
 * noisy data from producing misleading "improving" or "declining" labels.
 *
 * Returns 'stable' if:
 * - Fewer than 3 clean data points
 * - Slope magnitude <= 0.05 (practically insignificant)
 * - Slope fails t-test (statistically insignificant — could be noise)
 */
export function detectTrend(values: number[]): TrendDirection {
  // Filter out NaN, Infinity, and undefined values
  const clean = values.filter(v => Number.isFinite(v));
  if (clean.length < 3) return 'stable';

  const n = clean.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += clean[i];
    sumXY += i * clean[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 'stable';

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Gate 1: Practical significance — slope must exceed threshold
  if (Math.abs(slope) <= 0.05) return 'stable';

  // Gate 2: Statistical significance — t-test must pass at p=0.10
  if (!isSlopeSignificant(clean, slope, n)) return 'stable';

  return slope > 0 ? 'improving' : 'declining';
}

// --- Weekly Consistency ---

/**
 * Count unique training days in the last 7 days
 */
export function calculateWeeklyConsistency(sessions: Session[]): number {
  const now = new Date();
  const sevenDaysAgo = subDays(startOfDay(now), 7);
  const todayEnd = now;

  const uniqueDays = new Set<string>();

  for (const session of sessions) {
    if (session.completionStatus !== 'completed') continue;

    const sessionDate = parseISO(session.timestamp);
    if (isWithinInterval(sessionDate, { start: sevenDaysAgo, end: todayEnd })) {
      uniqueDays.add(startOfDay(sessionDate).toISOString());
    }
  }

  return uniqueDays.size;
}

// --- Spacing Quality (Spaced Repetition Science) ---

/**
 * Measures how well a learner's practice is distributed over time.
 * Based on the spacing effect (Ebbinghaus, 1885; Cepeda et al., 2006):
 * distributed practice produces stronger retention than massed practice.
 *
 * Two dimensions:
 * - frequencyScore: How often they practice (days per week, ideal = 5)
 * - regularityScore: How evenly spaced sessions are (CV of inter-session gaps)
 *
 * The regularity dimension is weighted higher (60%) because research shows
 * 3 evenly-spaced sessions outperform 5 clustered sessions for retention.
 */
export interface SpacingQuality {
  frequencyScore: number;    // 0-1: practice frequency (5 days/week = 1.0)
  regularityScore: number;   // 0-1: evenness of spacing (0 = irregular, 1 = perfectly even)
  overallScore: number;      // 0-1: weighted combination
  recommendation: 'excellent' | 'good-spacing' | 'clustered' | 'infrequent' | 'no-data';
}

export function calculateSpacingQuality(sessions: Session[]): SpacingQuality {
  const now = new Date();
  const sevenDaysAgo = subDays(startOfDay(now), 7);

  // Get unique training days in last 7 days (consistent with calculateWeeklyConsistency)
  const uniqueDayTimestamps: number[] = [];
  const seenDays = new Set<string>();

  const recentCompleted = sessions
    .filter(s => s.completionStatus === 'completed')
    .filter(s => {
      const d = parseISO(s.timestamp);
      return isWithinInterval(d, { start: sevenDaysAgo, end: now });
    })
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

  for (const session of recentCompleted) {
    const dayKey = startOfDay(parseISO(session.timestamp)).toISOString();
    if (!seenDays.has(dayKey)) {
      seenDays.add(dayKey);
      uniqueDayTimestamps.push(startOfDay(parseISO(session.timestamp)).getTime());
    }
  }

  const weeklyCount = uniqueDayTimestamps.length;
  const frequencyScore = Math.min(weeklyCount / 5, 1.0);

  // Need at least 2 unique days to measure gaps
  if (weeklyCount < 2) {
    return {
      frequencyScore,
      regularityScore: 0,
      overallScore: frequencyScore * 0.4,
      recommendation: 'no-data',
    };
  }

  // Calculate gaps between unique training days (in hours)
  const gaps: number[] = [];
  for (let i = 1; i < uniqueDayTimestamps.length; i++) {
    gaps.push((uniqueDayTimestamps[i] - uniqueDayTimestamps[i - 1]) / (1000 * 60 * 60));
  }

  // Coefficient of variation: std / mean (0 = perfectly regular, >1 = very irregular)
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (meanGap === 0) {
    // All sessions on same day (shouldn't happen with unique day filter)
    return { frequencyScore, regularityScore: 1, overallScore: frequencyScore * 0.4 + 0.6, recommendation: 'excellent' };
  }
  const variance = gaps.reduce((sum, g) => sum + (g - meanGap) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / meanGap;

  // Map CV to 0-1 score: CV=0 → 1.0, CV>=1 → 0.0
  const regularityScore = Math.max(0, Math.min(1, 1 - cv));

  // Weighted combination: regularity matters more than raw frequency
  const overallScore = frequencyScore * 0.4 + regularityScore * 0.6;

  let recommendation: SpacingQuality['recommendation'];
  if (frequencyScore >= 0.6 && regularityScore >= 0.6) {
    recommendation = 'excellent';
  } else if (frequencyScore >= 0.6 && regularityScore < 0.4) {
    recommendation = 'clustered';
  } else if (frequencyScore < 0.4) {
    recommendation = 'infrequent';
  } else {
    recommendation = 'good-spacing';
  }

  return { frequencyScore, regularityScore, overallScore, recommendation };
}

// --- Pattern Detectors ---

function detectMilestoneInsights(sessions: Session[]): Insight[] {
  const insights: Insight[] = [];
  const totalCompleted = sessions.length;

  // Session count milestones (check highest first, show only one)
  const milestones = [50, 25, 10, 5];
  for (const milestone of milestones) {
    if (totalCompleted >= milestone && totalCompleted < milestone + 3) {
      insights.push({
        id: `milestone-sessions-${milestone}`,
        category: 'milestone',
        icon: '🎯',
        title: `${milestone} Sessions Complete!`,
        message: `You've completed ${totalCompleted} training sessions - amazing dedication!`,
        priority: 1,
      });
      break;
    }
  }

  return insights;
}

function detectConsistencyInsights(sessions: Session[]): Insight[] {
  const insights: Insight[] = [];
  const weeklyCount = calculateWeeklyConsistency(sessions);
  const spacing = calculateSpacingQuality(sessions);

  if (weeklyCount >= 4) {
    if (spacing.regularityScore >= 0.6) {
      // Well-spaced practice — the gold standard per spacing effect research
      insights.push({
        id: 'consistency-excellent-spacing',
        category: 'positive',
        icon: '💪',
        title: 'Excellent Practice Pattern!',
        message: `${weeklyCount} days this week, well-spaced - distributed practice maximizes retention!`,
        priority: 3,
      });
    } else if (spacing.regularityScore < 0.4) {
      // High frequency but clustered — common pattern, actionable advice
      insights.push({
        id: 'consistency-clustered',
        category: 'general',
        icon: '📅',
        title: 'Try Spacing Sessions',
        message: `${weeklyCount} days this week - try spacing sessions more evenly for better retention`,
        priority: 3,
      });
    } else {
      insights.push({
        id: 'consistency-high-week',
        category: 'positive',
        icon: '💪',
        title: 'Great Consistency!',
        message: `You've trained ${weeklyCount} days this week - great consistency!`,
        priority: 3,
      });
    }
  } else if (weeklyCount === 3) {
    insights.push({
      id: 'consistency-moderate-week',
      category: 'general',
      icon: '📅',
      title: 'Building a Habit',
      message: `3 days this week - adding one more day with even spacing will strengthen retention!`,
      action: { label: 'Start Training', route: '/training' },
      priority: 3,
    });
  } else if (weeklyCount > 0 && weeklyCount < 3) {
    insights.push({
      id: 'consistency-low-week',
      category: 'concern',
      icon: '🎯',
      title: 'Train More Regularly',
      message: `Try to train more regularly - only ${weeklyCount} ${weeklyCount === 1 ? 'session' : 'sessions'} this week. Spacing practice evenly builds stronger skills.`,
      action: { label: 'Start Training', route: '/training' },
      priority: 2,
    });
  } else if (weeklyCount === 0) {
    insights.push({
      id: 'consistency-no-week',
      category: 'concern',
      icon: '🎯',
      title: 'Time to Train!',
      message: 'No training sessions this week yet - start one now!',
      action: { label: 'Start Training', route: '/training' },
      priority: 2,
    });
  }

  return insights;
}

function detectPerformanceTrends(_sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const modules = Object.keys(MODULE_DISPLAY_NAMES) as (keyof typeof MODULE_DISPLAY_NAMES)[];

  for (const mod of modules) {
    // Get accuracy values for this module's drills, ordered chronologically
    const moduleDrills = drillResults
      .filter(dr => dr.module === mod)
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

    if (moduleDrills.length < 3) continue;

    const accuracyValues = moduleDrills.slice(-10).map(dr => dr.accuracy);
    const trend = detectTrend(accuracyValues);
    const displayName = MODULE_DISPLAY_NAMES[mod] || mod;

    if (trend === 'improving') {
      const improvement = Math.round(accuracyValues[accuracyValues.length - 1] - accuracyValues[0]);
      insights.push({
        id: `performance-improving-${mod}`,
        category: 'positive',
        icon: '📈',
        title: `${displayName} Improving!`,
        message: improvement > 1
          ? `Your ${displayName} accuracy improved ${improvement}% recently!`
          : `Your ${displayName} accuracy is trending upward!`,
        priority: 3,
      });
    } else if (trend === 'declining') {
      insights.push({
        id: `performance-declining-${mod}`,
        category: 'concern',
        icon: '🎯',
        title: `${displayName} Needs Focus`,
        message: `${displayName} accuracy dipped recently - let's focus there`,
        action: { label: 'Start Training', route: '/training' },
        priority: 2,
      });
    }
  }

  return insights;
}

function detectTimePatterns(drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const modules = Object.keys(MODULE_DISPLAY_NAMES) as (keyof typeof MODULE_DISPLAY_NAMES)[];

  const avgTimes: { module: string; avg: number; accuracy: number }[] = [];

  for (const mod of modules) {
    const moduleDrills = drillResults.filter(dr => dr.module === mod && dr.timeToAnswer > 0);
    if (moduleDrills.length < 3) continue;

    const avgTime = moduleDrills.reduce((sum, dr) => sum + dr.timeToAnswer, 0) / moduleDrills.length;
    const avgAcc = moduleDrills.reduce((sum, dr) => sum + dr.accuracy, 0) / moduleDrills.length;
    avgTimes.push({ module: mod, avg: avgTime, accuracy: avgAcc });
  }

  if (avgTimes.length < 2) return insights;

  // Find fastest module
  const sorted = [...avgTimes].sort((a, b) => a.avg - b.avg);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];

  // Only report if significantly faster (>20% difference)
  if (fastest.avg < slowest.avg * 0.8) {
    const displayName = MODULE_DISPLAY_NAMES[fastest.module] || fastest.module;
    const avgSeconds = (fastest.avg / 1000).toFixed(1);
    insights.push({
      id: `time-fastest-${fastest.module}`,
      category: 'general',
      icon: '⚡',
      title: `Speed Star!`,
      message: `You're fastest at ${displayName} drills (avg ${avgSeconds}s)`,
      priority: 4,
    });
  }

  // Check for slow but accurate pattern
  if (slowest.accuracy > 80 && slowest.avg > fastest.avg * 1.3) {
    const displayName = MODULE_DISPLAY_NAMES[slowest.module] || slowest.module;
    insights.push({
      id: `time-slow-accurate-${slowest.module}`,
      category: 'general',
      icon: '📊',
      title: `Thoughtful Approach`,
      message: `Taking your time on ${displayName} - accuracy is high!`,
      priority: 4,
    });
  }

  return insights;
}

function detectConfidenceInsights(sessions: Session[]): Insight[] {
  const insights: Insight[] = [];

  const completedSessions = sessions
    .filter(s => s.completionStatus === 'completed' && s.confidenceAfter !== undefined)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (completedSessions.length < 3) return insights;

  const confidenceValues = completedSessions.slice(-10).map(s => s.confidenceAfter!);
  const trend = detectTrend(confidenceValues);

  if (trend === 'improving') {
    const first = confidenceValues[0];
    const last = confidenceValues[confidenceValues.length - 1];
    const changeStr = last > first ? `from ${first.toFixed(1)} to ${last.toFixed(1)}/5` : `+${(last - first).toFixed(1)} points`;
    insights.push({
      id: 'confidence-improving',
      category: 'positive',
      icon: '💪',
      title: 'Confidence Growing!',
      message: `Your confidence is growing! ${changeStr}`,
      priority: 3,
    });
  }

  const avgConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
  if (avgConfidence > 3.5) {
    insights.push({
      id: 'confidence-high-avg',
      category: 'positive',
      icon: '📈',
      title: 'Strong Confidence!',
      message: `Practice is building confidence - you're up to ${avgConfidence.toFixed(1)}/5 on average!`,
      priority: 3,
    });
  }

  return insights;
}

// --- Cognitive Insight Detectors ---

/**
 * Automaticity Detector
 * Tracks when response times decrease without accuracy loss — a key signal
 * that the brain is building faster neural pathways for number processing.
 * In dyscalculia training, automaticity (fast + accurate) is the goal:
 * it means the skill is moving from effortful processing to automatic retrieval.
 *
 * Compares earliest N drills vs latest N drills per module.
 * Requires ≥20% speed improvement AND accuracy must not drop ≥5 points.
 */
function detectAutomaticityInsights(_sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const modules = Object.keys(MODULE_DISPLAY_NAMES) as (keyof typeof MODULE_DISPLAY_NAMES)[];
  const MIN_DRILLS = 6; // need at least 3 early + 3 late
  const COMPARE_COUNT = 3;

  for (const mod of modules) {
    const moduleDrills = drillResults
      .filter(dr => dr.module === mod && dr.timeToAnswer > 0 && Number.isFinite(dr.accuracy))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

    if (moduleDrills.length < MIN_DRILLS) continue;

    const early = moduleDrills.slice(0, COMPARE_COUNT);
    const late = moduleDrills.slice(-COMPARE_COUNT);

    const earlyAvgTime = early.reduce((s, d) => s + d.timeToAnswer, 0) / COMPARE_COUNT;
    const lateAvgTime = late.reduce((s, d) => s + d.timeToAnswer, 0) / COMPARE_COUNT;
    const earlyAvgAcc = early.reduce((s, d) => s + d.accuracy, 0) / COMPARE_COUNT;
    const lateAvgAcc = late.reduce((s, d) => s + d.accuracy, 0) / COMPARE_COUNT;

    if (earlyAvgTime === 0) continue;

    const speedImprovement = (earlyAvgTime - lateAvgTime) / earlyAvgTime;
    const accuracyDrop = earlyAvgAcc - lateAvgAcc;

    // Speed improved ≥20% AND accuracy didn't drop ≥5 points
    if (speedImprovement >= 0.20 && accuracyDrop < 5) {
      const displayName = MODULE_DISPLAY_NAMES[mod] || mod;
      const pctFaster = Math.round(speedImprovement * 100);
      insights.push({
        id: `automaticity-${mod}`,
        category: 'positive',
        icon: '🧠',
        title: `${displayName}: Building Automaticity!`,
        message: `Your brain is processing ${displayName} ${pctFaster}% faster while staying accurate — number pathways are strengthening!`,
        priority: 2,
      });
    }
  }

  return insights;
}

/**
 * Struggle-to-Strength Detector
 * Identifies the module with the biggest accuracy improvement over time.
 * This is deeply motivating for dyscalculia learners — seeing that a
 * previously difficult area is now becoming a strength proves that
 * the brain CAN rewire with practice.
 *
 * Compares earliest N drill accuracies vs latest N per module.
 * Requires ≥10% improvement to report.
 */
function detectStruggleToStrengthInsights(_sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const modules = Object.keys(MODULE_DISPLAY_NAMES) as (keyof typeof MODULE_DISPLAY_NAMES)[];
  const MIN_DRILLS = 6;
  const COMPARE_COUNT = 3;

  let bestModule = '';
  let bestImprovement = 0;
  let bestEarlyAcc = 0;
  let bestLateAcc = 0;

  for (const mod of modules) {
    const moduleDrills = drillResults
      .filter(dr => dr.module === mod && Number.isFinite(dr.accuracy))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

    if (moduleDrills.length < MIN_DRILLS) continue;

    const early = moduleDrills.slice(0, COMPARE_COUNT);
    const late = moduleDrills.slice(-COMPARE_COUNT);

    const earlyAvgAcc = early.reduce((s, d) => s + d.accuracy, 0) / COMPARE_COUNT;
    const lateAvgAcc = late.reduce((s, d) => s + d.accuracy, 0) / COMPARE_COUNT;
    const improvement = lateAvgAcc - earlyAvgAcc;

    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestModule = mod;
      bestEarlyAcc = earlyAvgAcc;
      bestLateAcc = lateAvgAcc;
    }
  }

  if (bestImprovement >= 10 && bestModule) {
    const displayName = MODULE_DISPLAY_NAMES[bestModule] || bestModule;
    insights.push({
      id: `breakthrough-${bestModule}`,
      category: 'positive',
      icon: '🌟',
      title: `Biggest Breakthrough: ${displayName}!`,
      message: `${displayName} accuracy jumped from ${Math.round(bestEarlyAcc)}% to ${Math.round(bestLateAcc)}% — your brain is building new number pathways!`,
      priority: 2,
    });
  }

  return insights;
}

/**
 * Weakness Focus Detector
 * Identifies the module where focused practice would have the biggest impact.
 * For dyscalculia, knowing WHERE to focus is crucial — the brain can only
 * rewire one skill pathway at a time effectively.
 *
 * Flags a module if its recent accuracy is >10 points below the
 * cross-module average. Only uses recent drills (last 5 per module).
 */
function detectWeaknessInsights(_sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const modules = Object.keys(MODULE_DISPLAY_NAMES) as (keyof typeof MODULE_DISPLAY_NAMES)[];
  const RECENT_COUNT = 5;

  const moduleAccuracies: { module: string; recentAvg: number }[] = [];

  for (const mod of modules) {
    const moduleDrills = drillResults
      .filter(dr => dr.module === mod && Number.isFinite(dr.accuracy))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

    if (moduleDrills.length < 3) continue;

    const recent = moduleDrills.slice(-RECENT_COUNT);
    const recentAvg = recent.reduce((s, d) => s + d.accuracy, 0) / recent.length;
    moduleAccuracies.push({ module: mod, recentAvg });
  }

  if (moduleAccuracies.length < 2) return insights;

  const overallAvg = moduleAccuracies.reduce((s, m) => s + m.recentAvg, 0) / moduleAccuracies.length;

  // Find the weakest module
  const weakest = moduleAccuracies.reduce((w, m) => m.recentAvg < w.recentAvg ? m : w);
  const gap = overallAvg - weakest.recentAvg;

  if (gap >= 10) {
    const displayName = MODULE_DISPLAY_NAMES[weakest.module] || weakest.module;
    insights.push({
      id: `focus-area-${weakest.module}`,
      category: 'concern',
      icon: '🎯',
      title: `Focus Area: ${displayName}`,
      message: `${displayName} is at ${Math.round(weakest.recentAvg)}% (${Math.round(gap)} points below your average) — focused practice here will have the biggest impact on your number skills!`,
      action: { label: 'Practice Now', route: '/training' },
      priority: 2,
    });
  }

  return insights;
}

/**
 * Confidence-Performance Alignment Detector
 * Compares confidence trend with accuracy trend to reveal hidden progress.
 * Dyscalculia often creates a gap between actual ability and self-belief.
 * Detecting when accuracy improves before confidence catches up helps
 * the learner see that their brain IS rewiring even when it doesn't feel like it.
 *
 * Uses detectTrend on both confidence and accuracy time series.
 */
function detectConfidencePerformanceInsights(sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const insights: Insight[] = [];

  // Get confidence trend from sessions
  const sessionsWithConf = sessions
    .filter(s => s.completionStatus === 'completed' && s.confidenceAfter !== undefined)
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

  if (sessionsWithConf.length < 3) return insights;

  const confValues = sessionsWithConf.slice(-10).map(s => s.confidenceAfter!);
  const confTrend = detectTrend(confValues);

  // Get overall accuracy trend from drill results
  const allDrills = drillResults
    .filter(dr => Number.isFinite(dr.accuracy))
    .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());

  if (allDrills.length < 3) return insights;

  const accValues = allDrills.slice(-10).map(d => d.accuracy);
  const accTrend = detectTrend(accValues);

  if (accTrend === 'improving' && confTrend === 'improving') {
    insights.push({
      id: 'alignment-both-growing',
      category: 'positive',
      icon: '🚀',
      title: 'Skills AND Confidence Growing!',
      message: 'Your accuracy and confidence are both trending up — your brain is rewiring and you can feel it!',
      priority: 2,
    });
  } else if (accTrend === 'improving' && confTrend !== 'improving') {
    insights.push({
      id: 'alignment-hidden-progress',
      category: 'positive',
      icon: '💡',
      title: 'Better Than You Think!',
      message: 'Your accuracy is improving even though confidence hasn\'t caught up yet — your brain IS rewiring, trust the data!',
      priority: 2,
    });
  } else if (confTrend === 'improving' && accTrend !== 'improving') {
    insights.push({
      id: 'alignment-confidence-leading',
      category: 'general',
      icon: '💪',
      title: 'Confidence Leading the Way',
      message: 'Your confidence is growing — keep practicing to strengthen the accuracy to match!',
      action: { label: 'Keep Training', route: '/training' },
      priority: 3,
    });
  }

  return insights;
}

// --- Main Generator ---

/**
 * Generate personalized insights from session and drill data.
 * Returns top 5 insights sorted by priority (lower = higher priority).
 *
 * Detector categories:
 * - Milestones: Session count achievements
 * - Consistency: Practice frequency and spacing quality
 * - Performance Trends: Per-module accuracy direction (statistically validated)
 * - Time Patterns: Speed comparisons across modules
 * - Confidence: Self-reported confidence trends
 * - Automaticity: Speed improving without accuracy loss (brain pathway strengthening)
 * - Struggle-to-Strength: Biggest accuracy improvement area (brain rewiring proof)
 * - Weakness Focus: Where concentrated practice has the biggest impact
 * - Confidence-Performance Alignment: Hidden progress detection
 */
export function generateInsights(sessions: Session[], drillResults: DrillResult[]): Insight[] {
  const completedSessions = sessions.filter(s => s.completionStatus === 'completed');

  if (completedSessions.length < MIN_SESSIONS_FOR_INSIGHTS) {
    return [];
  }

  const allInsights: Insight[] = [
    ...detectMilestoneInsights(completedSessions),
    ...detectConsistencyInsights(completedSessions),
    ...detectPerformanceTrends(completedSessions, drillResults),
    ...detectTimePatterns(drillResults),
    ...detectConfidenceInsights(completedSessions),
    ...detectAutomaticityInsights(completedSessions, drillResults),
    ...detectStruggleToStrengthInsights(completedSessions, drillResults),
    ...detectWeaknessInsights(completedSessions, drillResults),
    ...detectConfidencePerformanceInsights(completedSessions, drillResults),
  ];

  // Sort by priority (ascending — lower number = higher priority)
  allInsights.sort((a, b) => a.priority - b.priority);

  // Return top MAX_INSIGHTS
  return allInsights.slice(0, MAX_INSIGHTS);
}
