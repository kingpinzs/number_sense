/**
 * InsightEngine — Core analytics service for the Discalculas dyscalculia training app.
 *
 * Queries all drill_results and sessions from Dexie once, then runs every analysis
 * in-memory for performance. Each analysis function is exported for unit testing.
 *
 * Analyses performed:
 *   1. Domain Strength/Weakness
 *   2. Time-of-Day
 *   3. Day-of-Week
 *   4. Session Frequency Impact
 *   5. Fatigue Detection
 *   6. Response Time Trends
 *   7. Difficulty Readiness
 *   8. Streak Correlation
 *   9. Weekly Progress
 *  10. Drill Type Effectiveness
 */

import { db } from '@/services/storage/db';
import { STORAGE_KEYS } from '@/services/storage/localStorage';
import type { DrillResult, Session } from '@/services/storage/schemas';
import {
  MIN_DATA_POINTS,
  MIN_CONFIDENCE,
  MIN_EFFECT_SIZE,
  DRILL_TO_DOMAIN,
  DRILL_LABELS,
  DOMAIN_LABELS,
  TIME_OF_DAY_RANGES,
  type Insight,
  type InsightType,
  type InsightEngineResult,
  type SuggestedDrill,
  type DomainPerformance,
  type ContextBucket,
  type TimeOfDay,
} from '@/services/training/insightTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Canonical list of all domain keys */
const ALL_DOMAINS = Object.keys(DOMAIN_LABELS) as Array<keyof typeof DOMAIN_LABELS>;

/** Drills available per domain, mirroring drillSelector.ts DOMAIN_DRILLS */
const DOMAIN_DRILLS: Record<string, string[]> = {
  numberSense: ['number_line', 'subitizing', 'magnitude_comparison'],
  placeValue: ['place_value', 'estimation', 'number_decomposition'],
  sequencing: ['sequencing', 'rhythmic_counting'],
  arithmetic: ['math_operations', 'number_bonds', 'fact_fluency', 'mental_math_strategy', 'fact_family'],
  spatial: ['spatial_rotation'],
  applied: ['fractions', 'time_measurement', 'working_memory', 'everyday_math'],
};

// ─── Confidence scoring ───────────────────────────────────────────────────────

/**
 * Compute a 0-1 confidence score for an insight based on sample size and effect size.
 *
 * Sample size factor:
 *   n < 5   → 0.2
 *   n < 10  → 0.4
 *   n < 20  → 0.6
 *   n < 50  → 0.8
 *   n >= 50 → 1.0
 *
 * Effect size factor: abs(delta) / 50, capped at 1.0.
 *
 * Final score = sampleFactor * effectFactor.
 *
 * @param n - Number of data points
 * @param delta - Absolute difference in percentage points between compared groups
 * @returns Confidence score in [0, 1]
 */
export function scoreConfidence(n: number, delta: number): number {
  let sampleFactor: number;
  if (n < 5) {
    sampleFactor = 0.2;
  } else if (n < 10) {
    sampleFactor = 0.4;
  } else if (n < 20) {
    sampleFactor = 0.6;
  } else if (n < 50) {
    sampleFactor = 0.8;
  } else {
    sampleFactor = 1.0;
  }

  const effectFactor = Math.min(Math.abs(delta) / 50, 1.0);
  return sampleFactor * effectFactor;
}

// ─── Pure helper utilities ────────────────────────────────────────────────────

/**
 * Calculate average of an array of numbers. Returns 0 for empty arrays.
 *
 * @param values - Numeric values
 * @returns Arithmetic mean
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Map a drill module name to its domain key using DRILL_TO_DOMAIN.
 * Returns null if the module is not in the mapping (e.g. game types).
 *
 * @param module - DrillResult.module value
 * @returns Domain key or null
 */
export function getDomain(module: string): string | null {
  return DRILL_TO_DOMAIN[module] ?? null;
}

/**
 * Classify an ISO timestamp into a time-of-day bucket.
 *
 * Ranges (hour in 0-23):
 *   morning   6–11
 *   afternoon 12–16
 *   evening   17–21
 *   night     22–23, 0–5
 *
 * @param timestamp - ISO 8601 string
 * @returns TimeOfDay label
 */
export function classifyTimeOfDay(timestamp: string): TimeOfDay {
  const hour = new Date(timestamp).getHours();
  const [mStart, mEnd] = TIME_OF_DAY_RANGES.morning;
  const [aStart, aEnd] = TIME_OF_DAY_RANGES.afternoon;
  const [eStart, eEnd] = TIME_OF_DAY_RANGES.evening;
  if (hour >= mStart && hour < mEnd) return 'morning';
  if (hour >= aStart && hour < aEnd) return 'afternoon';
  if (hour >= eStart && hour < eEnd) return 'evening';
  return 'night';
}

/**
 * Determine whether a date is a weekday or weekend.
 *
 * @param timestamp - ISO 8601 string
 * @returns 'weekday' or 'weekend'
 */
export function classifyDayType(timestamp: string): 'weekday' | 'weekend' {
  const day = new Date(timestamp).getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

/**
 * Build a deterministic insight ID from its constituent variables.
 *
 * @param type - InsightType string
 * @param parts - Variable-length qualifier parts
 * @returns Lowercase kebab-joined string
 */
export function buildInsightId(type: string, ...parts: string[]): string {
  return [type, ...parts]
    .map(p => p.toLowerCase().replace(/\s+/g, '-'))
    .join('_');
}

/**
 * Return the ISO timestamp for N days ago relative to now.
 *
 * @param days - Number of days
 * @returns ISO string
 */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Map domain accuracy to a suggested difficulty level.
 *
 * acc >= 80 → 'hard'
 * acc >= 50 → 'medium'
 * otherwise → 'easy'
 *
 * @param accuracy - 0-100 percentage
 * @returns difficulty level
 */
export function suggestDifficulty(accuracy: number): 'easy' | 'medium' | 'hard' {
  if (accuracy >= 80) return 'hard';
  if (accuracy >= 50) return 'medium';
  return 'easy';
}

/**
 * Get the dominant (most frequent) difficulty level used in a set of drill results.
 *
 * @param results - Subset of DrillResult records
 * @returns Most common difficulty, defaults to 'easy'
 */
export function dominantDifficulty(results: DrillResult[]): 'easy' | 'medium' | 'hard' {
  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.difficulty] = (counts[r.difficulty] ?? 0) + 1;
  }
  let best: 'easy' | 'medium' | 'hard' = 'easy';
  let max = 0;
  for (const [diff, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = diff as 'easy' | 'medium' | 'hard';
    }
  }
  return best;
}

// ─── Analysis functions ────────────────────────────────────────────────────────

/**
 * Analysis 1: Domain Strength and Weakness
 *
 * Groups drill results by domain, calculates recent accuracy (last 10 per domain)
 * and previous accuracy (10 before that). Generates a 'strength' insight for the
 * best-performing domain and a 'weakness' insight for the worst, but only when
 * the gap between them is >= MIN_EFFECT_SIZE.
 *
 * @param results - All drill results
 * @returns Array of 0-2 Insight objects
 */
export function analyzeDomains(results: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  // Group by domain
  const byDomain: Record<string, DrillResult[]> = {};
  for (const r of results) {
    const domain = getDomain(r.module);
    if (!domain) continue;
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(r);
  }

  // Calculate recent accuracy per domain
  const domainAccuracies: Array<{ domain: string; recentAccuracy: number; count: number }> = [];
  for (const domain of ALL_DOMAINS) {
    const domainResults = byDomain[domain] ?? [];
    if (domainResults.length === 0) continue;

    // Sort ascending by timestamp
    const sorted = [...domainResults].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const recent = sorted.slice(-10);
    const recentAccuracy = average(recent.map(r => r.accuracy));
    domainAccuracies.push({ domain, recentAccuracy, count: domainResults.length });
  }

  if (domainAccuracies.length < 2) return insights;

  domainAccuracies.sort((a, b) => b.recentAccuracy - a.recentAccuracy);
  const best = domainAccuracies[0];
  const worst = domainAccuracies[domainAccuracies.length - 1];
  const delta = best.recentAccuracy - worst.recentAccuracy;

  if (delta < MIN_EFFECT_SIZE) return insights;

  // Strength insight
  const strengthConfidence = scoreConfidence(best.count, delta);
  if (strengthConfidence >= MIN_CONFIDENCE) {
    insights.push({
      id: buildInsightId('strength', best.domain),
      type: 'strength',
      confidence: strengthConfidence,
      domain: best.domain,
      title: `${DOMAIN_LABELS[best.domain] ?? best.domain} is your strongest area`,
      message: `Your recent accuracy in ${DOMAIN_LABELS[best.domain] ?? best.domain} is ${Math.round(best.recentAccuracy)}% — keep it up!`,
      action: {
        label: 'Practice to maintain',
        domain: best.domain,
        drillType: DOMAIN_DRILLS[best.domain]?.[0],
        difficulty: suggestDifficulty(best.recentAccuracy),
      },
      priority: Math.round(strengthConfidence * 50),
      variables: ['domain', 'recentAccuracy', 'drillCount'],
      generatedAt: now,
    });
  }

  // Weakness insight
  const weaknessConfidence = scoreConfidence(worst.count, delta);
  if (weaknessConfidence >= MIN_CONFIDENCE) {
    insights.push({
      id: buildInsightId('weakness', worst.domain),
      type: 'weakness',
      confidence: weaknessConfidence,
      domain: worst.domain,
      title: `${DOMAIN_LABELS[worst.domain] ?? worst.domain} needs attention`,
      message: `Your accuracy in ${DOMAIN_LABELS[worst.domain] ?? worst.domain} is ${Math.round(worst.recentAccuracy)}% — ${Math.round(delta)}% below your best domain.`,
      action: {
        label: 'Focus here',
        domain: worst.domain,
        drillType: DOMAIN_DRILLS[worst.domain]?.[0],
        difficulty: suggestDifficulty(worst.recentAccuracy),
      },
      priority: Math.round(weaknessConfidence * 80),
      variables: ['domain', 'recentAccuracy', 'drillCount'],
      generatedAt: now,
    });
  }

  return insights;
}

/**
 * Analysis 2: Time-of-Day Performance
 *
 * Buckets drills into morning / afternoon / evening / night based on timestamp hour.
 * Generates a 'discovery' insight when the best time bucket is >= MIN_EFFECT_SIZE
 * better than the worst, with sufficient confidence.
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeTimeOfDay(results: DrillResult[]): Insight[] {
  const buckets: Record<TimeOfDay, { accuracy: number[]; responseTime: number[] }> = {
    morning: { accuracy: [], responseTime: [] },
    afternoon: { accuracy: [], responseTime: [] },
    evening: { accuracy: [], responseTime: [] },
    night: { accuracy: [], responseTime: [] },
  };

  for (const r of results) {
    const tod = classifyTimeOfDay(r.timestamp);
    buckets[tod].accuracy.push(r.accuracy);
    buckets[tod].responseTime.push(r.timeToAnswer);
  }

  const times = (Object.keys(buckets) as TimeOfDay[]).filter(k => buckets[k].accuracy.length > 0);
  if (times.length < 2) return [];

  const accuracies = times.map(k => ({ key: k, avg: average(buckets[k].accuracy), count: buckets[k].accuracy.length }));
  accuracies.sort((a, b) => b.avg - a.avg);

  const best = accuracies[0];
  const worst = accuracies[accuracies.length - 1];
  const delta = best.avg - worst.avg;
  const totalN = best.count + worst.count;

  if (delta < MIN_EFFECT_SIZE) return [];

  const confidence = scoreConfidence(totalN, delta);
  if (confidence < MIN_CONFIDENCE) return [];

  const now = new Date().toISOString();
  return [
    {
      id: buildInsightId('discovery', 'time-of-day', best.key),
      type: 'discovery',
      confidence,
      title: `You perform best in the ${best.key}`,
      message: `You perform ${Math.round(delta)}% better in the ${best.key} than ${worst.key}. Try scheduling practice sessions during this time.`,
      action: { label: `Schedule ${best.key} sessions` },
      priority: Math.round(confidence * 60),
      variables: ['timestamp', 'hour', 'timeOfDay', 'accuracy'],
      generatedAt: now,
    },
  ];
}

/**
 * Analysis 3: Day-of-Week Performance (weekday vs weekend)
 *
 * Compares accuracy between weekday (Mon-Fri) and weekend (Sat-Sun) drills.
 * Generates a 'discovery' insight if the difference is significant.
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeDayOfWeek(results: DrillResult[]): Insight[] {
  const buckets: Record<'weekday' | 'weekend', number[]> = {
    weekday: [],
    weekend: [],
  };

  for (const r of results) {
    buckets[classifyDayType(r.timestamp)].push(r.accuracy);
  }

  if (buckets.weekday.length === 0 || buckets.weekend.length === 0) return [];

  const weekdayAvg = average(buckets.weekday);
  const weekendAvg = average(buckets.weekend);
  const delta = Math.abs(weekdayAvg - weekendAvg);
  const totalN = buckets.weekday.length + buckets.weekend.length;

  if (delta < MIN_EFFECT_SIZE) return [];

  const confidence = scoreConfidence(totalN, delta);
  if (confidence < MIN_CONFIDENCE) return [];

  const better = weekdayAvg >= weekendAvg ? 'weekdays' : 'weekends';
  const worse = better === 'weekdays' ? 'weekends' : 'weekdays';
  const now = new Date().toISOString();

  return [
    {
      id: buildInsightId('discovery', 'day-of-week', better),
      type: 'discovery',
      confidence,
      title: `You do better on ${better}`,
      message: `Your accuracy on ${better} is ${Math.round(delta)}% higher than on ${worse}. Try to practice more consistently on ${worse}.`,
      action: { label: `Practice on ${worse} too` },
      priority: Math.round(confidence * 50),
      variables: ['timestamp', 'dayOfWeek', 'dayType', 'accuracy'],
      generatedAt: now,
    },
  ];
}

/**
 * Analysis 4: Session Frequency Impact
 *
 * Compares accuracy of drills done in sessions with a short gap (<24 h) since the
 * previous session vs a long gap (>48 h). Generates an insight encouraging daily practice.
 *
 * @param results - All drill results
 * @param sessions - All sessions, used to compute inter-session gaps
 * @returns Array of 0-1 Insight objects
 */
export function analyzeSessionFrequency(results: DrillResult[], sessions: Session[]): Insight[] {
  if (sessions.length < 2) return [];

  // Build a set of sessionIds with short / long gaps
  const sorted = [...sessions]
    .filter(s => s.id !== undefined)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const shortGapSessionIds = new Set<number>();
  const longGapSessionIds = new Set<number>();

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].timestamp).getTime();
    const curr = new Date(sorted[i].timestamp).getTime();
    const gapHours = (curr - prev) / (1000 * 60 * 60);
    const sessionId = sorted[i].id as number;
    if (gapHours < 24) {
      shortGapSessionIds.add(sessionId);
    } else if (gapHours > 48) {
      longGapSessionIds.add(sessionId);
    }
  }

  if (shortGapSessionIds.size === 0 || longGapSessionIds.size === 0) return [];

  const shortAccuracies = results.filter(r => shortGapSessionIds.has(r.sessionId)).map(r => r.accuracy);
  const longAccuracies = results.filter(r => longGapSessionIds.has(r.sessionId)).map(r => r.accuracy);

  if (shortAccuracies.length === 0 || longAccuracies.length === 0) return [];

  const shortAvg = average(shortAccuracies);
  const longAvg = average(longAccuracies);
  const delta = shortAvg - longAvg;

  if (Math.abs(delta) < MIN_EFFECT_SIZE) return [];

  const totalN = shortAccuracies.length + longAccuracies.length;
  const confidence = scoreConfidence(totalN, delta);
  if (confidence < MIN_CONFIDENCE) return [];

  const now = new Date().toISOString();
  const improvement = Math.abs(Math.round(delta));

  return [
    {
      id: buildInsightId('discovery', 'session-frequency'),
      type: 'discovery',
      confidence,
      title: 'Daily practice boosts your accuracy',
      message: `Daily practice correlates with ${improvement}% higher accuracy compared to sessions with longer breaks.`,
      action: { label: 'Practice daily' },
      priority: Math.round(confidence * 65),
      variables: ['sessionGap', 'sessionFrequency', 'accuracy'],
      generatedAt: now,
    },
  ];
}

/**
 * Analysis 5: Fatigue Detection
 *
 * For each session with >= 6 drills, compares the accuracy of the first 3 drills
 * vs the last 3. If the drop is > 15 percentage points, generates a 'recommendation'
 * insight to try shorter sessions.
 *
 * @param results - All drill results
 * @param sessions - All sessions (used to group results)
 * @returns Array of 0-1 Insight objects
 */
export function analyzeFatigue(results: DrillResult[], sessions: Session[]): Insight[] {
  const FATIGUE_THRESHOLD = 15;

  // Group results by sessionId
  const bySession: Record<number, DrillResult[]> = {};
  for (const r of results) {
    if (!bySession[r.sessionId]) bySession[r.sessionId] = [];
    bySession[r.sessionId].push(r);
  }

  const drops: number[] = [];
  let totalN = 0;

  for (const session of sessions) {
    if (session.id === undefined) continue;
    const sessionResults = (bySession[session.id] ?? [])
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (sessionResults.length < 6) continue;

    const firstThree = sessionResults.slice(0, 3);
    const lastThree = sessionResults.slice(-3);
    const firstAvg = average(firstThree.map(r => r.accuracy));
    const lastAvg = average(lastThree.map(r => r.accuracy));
    const drop = firstAvg - lastAvg;
    drops.push(drop);
    totalN += sessionResults.length;
  }

  if (drops.length === 0) return [];

  const avgDrop = average(drops);
  if (avgDrop <= FATIGUE_THRESHOLD) return [];

  const confidence = scoreConfidence(totalN, avgDrop);
  if (confidence < MIN_CONFIDENCE) return [];

  const roundedDrop = Math.round(avgDrop);
  const now = new Date().toISOString();

  return [
    {
      id: buildInsightId('recommendation', 'fatigue'),
      type: 'recommendation',
      confidence,
      title: 'Your accuracy drops toward the end of sessions',
      message: `Your accuracy drops ${roundedDrop}% after the first few drills — try shorter sessions to maintain peak performance.`,
      action: { label: 'Try a Quick Session (6 drills)' },
      priority: Math.round(confidence * 70),
      variables: ['sessionLength', 'drillPosition', 'fatigueIndex', 'accuracy'],
      generatedAt: now,
    },
  ];
}

/**
 * Analysis 6: Response Time Trends
 *
 * Compares average response time (ms) this week vs last week.
 * Generates a 'trend' insight if the change is significant.
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeResponseTime(results: DrillResult[]): Insight[] {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now - oneWeekMs;
  const lastWeekStart = now - 2 * oneWeekMs;

  const thisWeek = results.filter(r => {
    const t = new Date(r.timestamp).getTime();
    return t >= thisWeekStart;
  });

  const lastWeek = results.filter(r => {
    const t = new Date(r.timestamp).getTime();
    return t >= lastWeekStart && t < thisWeekStart;
  });

  if (thisWeek.length === 0 || lastWeek.length === 0) return [];

  const thisAvg = average(thisWeek.map(r => r.timeToAnswer));
  const lastAvg = average(lastWeek.map(r => r.timeToAnswer));

  // Convert ms difference to a % change for significance check
  const deltaMs = lastAvg - thisAvg; // positive = getting faster
  const deltaPct = lastAvg > 0 ? (Math.abs(deltaMs) / lastAvg) * 100 : 0;

  if (deltaPct < MIN_EFFECT_SIZE) return [];

  const totalN = thisWeek.length + lastWeek.length;
  const confidence = scoreConfidence(totalN, deltaPct);
  if (confidence < MIN_CONFIDENCE) return [];

  const faster = deltaMs > 0;
  const changeLabel = faster ? 'faster' : 'slower';
  const nowISO = new Date().toISOString();

  return [
    {
      id: buildInsightId('trend', 'response-time', changeLabel),
      type: 'trend',
      confidence,
      title: faster ? 'Your response speed is improving' : 'Your response speed has slowed down',
      message: faster
        ? `You answered ${Math.round(deltaPct)}% faster this week compared to last week — great progress!`
        : `Your response time increased by ${Math.round(deltaPct)}% this week. Consider slowing down to focus on accuracy first.`,
      action: { label: faster ? 'Keep it up' : 'Focus on accuracy' },
      priority: Math.round(confidence * 55),
      variables: ['responseTime', 'weeklyComparison', 'timeToAnswer'],
      generatedAt: nowISO,
    },
  ];
}

/**
 * Analysis 7: Difficulty Readiness
 *
 * For each domain where recent accuracy (last 10 drills) is >= 80%, suggests moving
 * up to the next difficulty level. Generates a 'recommendation' insight per domain.
 *
 * @param results - All drill results
 * @returns Array of 0-N Insight objects (one per ready domain)
 */
export function analyzeDifficultyReadiness(results: DrillResult[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  const byDomain: Record<string, DrillResult[]> = {};
  for (const r of results) {
    const domain = getDomain(r.module);
    if (!domain) continue;
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(r);
  }

  for (const domain of ALL_DOMAINS) {
    const domainResults = byDomain[domain] ?? [];
    if (domainResults.length < 5) continue;

    const sorted = [...domainResults].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const recent = sorted.slice(-10);
    const recentAccuracy = average(recent.map(r => r.accuracy));
    if (recentAccuracy < 80) continue;

    const currentDiff = dominantDifficulty(recent);
    if (currentDiff === 'hard') continue; // already at max

    const nextDiff = currentDiff === 'easy' ? 'medium' : 'hard';
    const label = DOMAIN_LABELS[domain] ?? domain;
    // Use accuracy vs neutral 50% baseline as effect size proxy — gives a
    // more meaningful signal than accuracy vs the 80% threshold alone.
    const confidence = scoreConfidence(recent.length, recentAccuracy - 50);
    if (confidence < MIN_CONFIDENCE) continue;

    insights.push({
      id: buildInsightId('recommendation', 'difficulty-readiness', domain),
      type: 'recommendation',
      confidence,
      domain,
      title: `Ready for ${nextDiff} in ${label}`,
      message: `Your recent accuracy in ${label} is ${Math.round(recentAccuracy)}% — you're ready to move up to ${nextDiff}!`,
      action: {
        label: `Try ${nextDiff} difficulty`,
        domain,
        drillType: DOMAIN_DRILLS[domain]?.[0],
        difficulty: nextDiff,
      },
      priority: Math.round(confidence * 75),
      variables: ['domain', 'recentAccuracy', 'currentDifficulty'],
      generatedAt: now,
    });
  }

  return insights;
}

/**
 * Analysis 8: Streak Correlation
 *
 * Reads the current streak from localStorage. If streak >= 3 and recent accuracy
 * (last 20 drills) is notably high (>= 70%), generates a 'discovery' insight
 * connecting consistent practice to performance.
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeStreakCorrelation(results: DrillResult[]): Insight[] {
  const rawStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
  const streak = rawStreak ? parseInt(rawStreak, 10) || 0 : 0;
  if (streak < 3) return [];

  if (results.length < 5) return [];

  const sorted = [...results].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const recent = sorted.slice(-20);
  const recentAccuracy = average(recent.map(r => r.accuracy));

  // Only surface if high performance on a meaningful streak
  if (recentAccuracy < 70) return [];

  const delta = recentAccuracy - 50; // vs a neutral baseline of 50%
  const confidence = scoreConfidence(recent.length, delta);
  if (confidence < MIN_CONFIDENCE) return [];

  const now = new Date().toISOString();
  return [
    {
      id: buildInsightId('discovery', 'streak-correlation', String(streak)),
      type: 'discovery',
      confidence,
      title: `${streak}-day streak — and your accuracy shows it`,
      message: `You're on a ${streak}-day streak! Your recent accuracy is ${Math.round(recentAccuracy)}% — consistent practice is paying off.`,
      action: { label: 'Keep the streak alive' },
      priority: Math.round(confidence * 60),
      variables: ['streak', 'recentAccuracy', 'sessionFrequency'],
      generatedAt: now,
    },
  ];
}

/**
 * Analysis 9: Weekly Progress
 *
 * Compares overall accuracy this week vs last week.
 * Generates a 'trend' insight for significant change or a 'milestone' insight for
 * notable improvement (>= 10% gain).
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeWeeklyProgress(results: DrillResult[]): Insight[] {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now - oneWeekMs;
  const lastWeekStart = now - 2 * oneWeekMs;

  const thisWeek = results.filter(r => new Date(r.timestamp).getTime() >= thisWeekStart);
  const lastWeek = results.filter(r => {
    const t = new Date(r.timestamp).getTime();
    return t >= lastWeekStart && t < thisWeekStart;
  });

  if (thisWeek.length === 0 || lastWeek.length === 0) return [];

  const thisAvg = average(thisWeek.map(r => r.accuracy));
  const lastAvg = average(lastWeek.map(r => r.accuracy));
  const delta = thisAvg - lastAvg;

  if (Math.abs(delta) < MIN_EFFECT_SIZE) return [];

  const totalN = thisWeek.length + lastWeek.length;
  const confidence = scoreConfidence(totalN, Math.abs(delta));
  if (confidence < MIN_CONFIDENCE) return [];

  const nowISO = new Date().toISOString();
  const improving = delta > 0;
  const type: InsightType = improving && delta >= 10 ? 'milestone' : 'trend';

  return [
    {
      id: buildInsightId(type, 'weekly-progress'),
      type,
      confidence,
      title: improving ? 'Your accuracy improved this week' : 'Your accuracy dipped this week',
      message: improving
        ? `You improved by ${Math.round(delta)}% compared to last week — outstanding progress!`
        : `Your accuracy dropped ${Math.round(Math.abs(delta))}% compared to last week. More practice will help turn this around.`,
      action: { label: improving ? 'Keep going' : 'Bounce back — practice today' },
      priority: Math.round(confidence * (type === 'milestone' ? 90 : 65)),
      variables: ['weeklyAccuracy', 'trendDirection', 'weekComparison'],
      generatedAt: nowISO,
    },
  ];
}

/**
 * Analysis 10: Drill Type Effectiveness
 *
 * Tracks per-drill-type improvement by splitting results into two chronological halves
 * (early vs recent). Generates a 'recommendation' insight for the drill that shows the
 * greatest improvement, encouraging the user to do more of what works.
 *
 * @param results - All drill results
 * @returns Array of 0-1 Insight objects
 */
export function analyzeDrillEffectiveness(results: DrillResult[]): Insight[] {
  if (results.length < 10) return [];

  // Group by drill type
  const byDrill: Record<string, DrillResult[]> = {};
  for (const r of results) {
    if (!DRILL_TO_DOMAIN[r.module]) continue; // skip unknown modules
    if (!byDrill[r.module]) byDrill[r.module] = [];
    byDrill[r.module].push(r);
  }

  let bestDrill: string | null = null;
  let bestImprovement = -Infinity;
  let bestCount = 0;

  for (const [drillType, drillResults] of Object.entries(byDrill)) {
    if (drillResults.length < 4) continue;

    const sorted = [...drillResults].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const midpoint = Math.floor(sorted.length / 2);
    const early = sorted.slice(0, midpoint);
    const recent = sorted.slice(midpoint);

    const earlyAvg = average(early.map(r => r.accuracy));
    const recentAvg = average(recent.map(r => r.accuracy));
    const improvement = recentAvg - earlyAvg;

    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestDrill = drillType;
      bestCount = drillResults.length;
    }
  }

  if (bestDrill === null || bestImprovement < MIN_EFFECT_SIZE) return [];

  const confidence = scoreConfidence(bestCount, bestImprovement);
  if (confidence < MIN_CONFIDENCE) return [];

  const domain = getDomain(bestDrill) ?? '';
  const drillLabel = DRILL_LABELS[bestDrill] ?? bestDrill;
  const now = new Date().toISOString();

  return [
    {
      id: buildInsightId('recommendation', 'drill-effectiveness', bestDrill),
      type: 'recommendation',
      confidence,
      domain,
      title: `${drillLabel} is your most effective drill`,
      message: `Your accuracy in ${drillLabel} improved by ${Math.round(bestImprovement)}% over time — this drill is working well for you. Do more of it!`,
      action: {
        label: `Practice ${drillLabel}`,
        domain,
        drillType: bestDrill,
        difficulty: suggestDifficulty(bestImprovement + 50),
      },
      priority: Math.round(confidence * 55),
      variables: ['drillType', 'improvementDelta', 'historicalAccuracy'],
      generatedAt: now,
    },
  ];
}

// ─── Domain performance snapshots ────────────────────────────────────────────

/**
 * Build DomainPerformance snapshots for all 6 domains.
 *
 * For each domain:
 * - recentAccuracy: average accuracy of last 10 drills
 * - previousAccuracy: average accuracy of 10 drills before that
 * - trend: recentAccuracy - previousAccuracy
 * - totalDrills: total count
 * - avgResponseTime: average timeToAnswer in recent window
 * - currentDifficulty: dominant difficulty in recent window
 *
 * @param results - All drill results
 * @returns Array of DomainPerformance (all 6 domains, zeroed if no data)
 */
export function buildDomainPerformance(results: DrillResult[]): DomainPerformance[] {
  const byDomain: Record<string, DrillResult[]> = {};
  for (const r of results) {
    const domain = getDomain(r.module);
    if (!domain) continue;
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(r);
  }

  return ALL_DOMAINS.map(domain => {
    const domainResults = byDomain[domain] ?? [];
    const sorted = [...domainResults].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const recent = sorted.slice(-10);
    const previous = sorted.slice(-20, -10);

    const recentAccuracy = average(recent.map(r => r.accuracy));
    const previousAccuracy = average(previous.map(r => r.accuracy));
    const trend = recentAccuracy - previousAccuracy;
    const avgResponseTime = average(recent.map(r => r.timeToAnswer));
    const currentDifficulty = recent.length > 0 ? dominantDifficulty(recent) : 'easy';

    return {
      domain,
      domainLabel: DOMAIN_LABELS[domain] ?? domain,
      recentAccuracy,
      previousAccuracy,
      trend,
      totalDrills: domainResults.length,
      avgResponseTime,
      currentDifficulty,
    };
  });
}

// ─── Context buckets ──────────────────────────────────────────────────────────

/**
 * Build ContextBucket arrays for time-of-day and day-of-week variables.
 *
 * @param results - All drill results
 * @returns Array of ContextBucket objects covering all time and day buckets
 */
export function buildContextBuckets(results: DrillResult[]): ContextBucket[] {
  const timeOfDayBuckets: Record<TimeOfDay, { accuracy: number[]; responseTime: number[] }> = {
    morning: { accuracy: [], responseTime: [] },
    afternoon: { accuracy: [], responseTime: [] },
    evening: { accuracy: [], responseTime: [] },
    night: { accuracy: [], responseTime: [] },
  };

  const dayTypeBuckets: Record<'weekday' | 'weekend', { accuracy: number[]; responseTime: number[] }> = {
    weekday: { accuracy: [], responseTime: [] },
    weekend: { accuracy: [], responseTime: [] },
  };

  for (const r of results) {
    const tod = classifyTimeOfDay(r.timestamp);
    timeOfDayBuckets[tod].accuracy.push(r.accuracy);
    timeOfDayBuckets[tod].responseTime.push(r.timeToAnswer);

    const dayType = classifyDayType(r.timestamp);
    dayTypeBuckets[dayType].accuracy.push(r.accuracy);
    dayTypeBuckets[dayType].responseTime.push(r.timeToAnswer);
  }

  const todBuckets: ContextBucket[] = (Object.keys(timeOfDayBuckets) as TimeOfDay[]).map(key => ({
    variable: 'timeOfDay',
    label: key,
    count: timeOfDayBuckets[key].accuracy.length,
    avgAccuracy: average(timeOfDayBuckets[key].accuracy),
    avgResponseTime: average(timeOfDayBuckets[key].responseTime),
  }));

  const dayBuckets: ContextBucket[] = (['weekday', 'weekend'] as const).map(key => ({
    variable: 'dayOfWeek',
    label: key,
    count: dayTypeBuckets[key].accuracy.length,
    avgAccuracy: average(dayTypeBuckets[key].accuracy),
    avgResponseTime: average(dayTypeBuckets[key].responseTime),
  }));

  return [...todBuckets, ...dayBuckets];
}

// ─── Suggested drills generation ─────────────────────────────────────────────

/**
 * Generate a ranked list of SuggestedDrill objects.
 *
 * Strategy: weakest domains first, using the drill type with the lowest recent accuracy.
 * Each domain contributes at most one suggestion. Domains with no data get a default
 * suggestion so the user always has something to try.
 *
 * @param results - All drill results
 * @param domainPerformance - Pre-computed DomainPerformance snapshots
 * @returns Sorted SuggestedDrill array (highest priority first)
 */
export function buildSuggestedDrills(
  results: DrillResult[],
  domainPerformance: DomainPerformance[],
): SuggestedDrill[] {
  // Group results by module for per-drill accuracy
  const byDrill: Record<string, DrillResult[]> = {};
  for (const r of results) {
    if (!byDrill[r.module]) byDrill[r.module] = [];
    byDrill[r.module].push(r);
  }

  // Sort domains worst → best accuracy (prioritise weak areas)
  const sorted = [...domainPerformance].sort((a, b) => a.recentAccuracy - b.recentAccuracy);

  const suggestions: SuggestedDrill[] = sorted.map((dp, idx) => {
    const drillsInDomain = DOMAIN_DRILLS[dp.domain] ?? [];

    // Find the drill in this domain with the lowest recent accuracy
    let worstDrill = drillsInDomain[0] ?? dp.domain;
    let worstAccuracy = Infinity;

    for (const drillType of drillsInDomain) {
      const drillResults = byDrill[drillType] ?? [];
      if (drillResults.length === 0) {
        // Untried drill — highest priority within domain
        worstDrill = drillType;
        worstAccuracy = 0;
        break;
      }
      const recentTen = [...drillResults]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .slice(-10);
      const acc = average(recentTen.map(r => r.accuracy));
      if (acc < worstAccuracy) {
        worstAccuracy = acc;
        worstDrill = drillType;
      }
    }

    const reason =
      dp.totalDrills === 0
        ? `You haven't tried ${DOMAIN_LABELS[dp.domain] ?? dp.domain} yet — start here!`
        : `Your accuracy is ${Math.round(dp.recentAccuracy)}% — this is one of your weaker areas.`;

    return {
      drillType: worstDrill,
      name: DRILL_LABELS[worstDrill] ?? worstDrill,
      reason,
      domain: dp.domain,
      difficulty: suggestDifficulty(dp.recentAccuracy),
      priority: sorted.length - idx, // highest rank for weakest domain
    };
  });

  return suggestions;
}

// ─── Public alias exports (required by test contract) ────────────────────────

/**
 * Alias for classifyTimeOfDay.
 * Classifies a Date object into a time-of-day bucket.
 *
 * @param date - JavaScript Date object
 * @returns TimeOfDay label
 */
export function getTimeOfDay(date: Date): TimeOfDay {
  return classifyTimeOfDay(date.toISOString());
}

/**
 * Alias for scoreConfidence using the formula:
 * Math.min(1, sampleSize / 50) * (effectSize / 30), capped at 1.0.
 *
 * Note: this formula matches the public API contract in insightTypes.ts.
 * The internal scoreConfidence uses a stepped sample factor; this export
 * uses the simpler formula documented in the requirements.
 *
 * @param sampleSize - Number of data points
 * @param effectSize - Absolute effect size in percentage points
 * @returns Confidence score in [0, 1]
 */
export function calculateConfidence(sampleSize: number, effectSize: number): number {
  return Math.min(1, (Math.min(1, sampleSize / 50)) * (effectSize / 30));
}

/**
 * Alias for buildInsightId.
 * Generates a deterministic insight ID from type and qualifier keys.
 *
 * @param type - InsightType string
 * @param keys - Variable-length qualifier parts
 * @returns Lowercase kebab/underscore-joined string
 */
export function generateInsightId(type: string, ...keys: string[]): string {
  return buildInsightId(type, ...keys);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Analyse all available training data and surface actionable insights.
 *
 * This function performs a single bulk query from Dexie (all drill_results,
 * all sessions) then runs every analysis in-memory for maximum performance.
 *
 * When there is not enough data (< MIN_DATA_POINTS drill results), the function
 * returns immediately with hasEnoughData: false and empty arrays so the caller
 * can show an appropriate empty state.
 *
 * @returns InsightEngineResult containing insights, suggested drills, domain
 *   performance snapshots, and context analysis buckets.
 */
export async function analyzePerformance(): Promise<InsightEngineResult> {
  const analyzedAt = new Date().toISOString();

  // Single bulk fetch — all subsequent analysis is in-memory
  const [allResults, allSessions] = await Promise.all([
    db.drill_results.toArray(),
    db.sessions.toArray(),
  ]);

  const dataPointCount = allResults.length;
  const hasEnoughData = dataPointCount >= MIN_DATA_POINTS;

  // Build domain performance and context buckets regardless of data sufficiency
  // (used by UI progress bars even with partial data)
  const domainPerformance = buildDomainPerformance(allResults);
  const contextAnalysis = buildContextBuckets(allResults);

  if (!hasEnoughData) {
    return {
      analyzedAt,
      dataPointCount,
      hasEnoughData,
      insights: [],
      suggestedDrills: buildSuggestedDrills(allResults, domainPerformance),
      domainPerformance,
      contextAnalysis,
    };
  }

  // Run all analyses in parallel (pure in-memory — no extra DB calls)
  const insightArrays = await Promise.all([
    Promise.resolve(analyzeDomains(allResults)),
    Promise.resolve(analyzeTimeOfDay(allResults)),
    Promise.resolve(analyzeDayOfWeek(allResults)),
    Promise.resolve(analyzeSessionFrequency(allResults, allSessions)),
    Promise.resolve(analyzeFatigue(allResults, allSessions)),
    Promise.resolve(analyzeResponseTime(allResults)),
    Promise.resolve(analyzeDifficultyReadiness(allResults)),
    Promise.resolve(analyzeStreakCorrelation(allResults)),
    Promise.resolve(analyzeWeeklyProgress(allResults)),
    Promise.resolve(analyzeDrillEffectiveness(allResults)),
  ]);

  // Flatten, filter by MIN_CONFIDENCE, and sort by priority descending
  const insights: Insight[] = insightArrays
    .flat()
    .filter(i => i.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => b.priority - a.priority);

  const suggestedDrills = buildSuggestedDrills(allResults, domainPerformance);

  return {
    analyzedAt,
    dataPointCount,
    hasEnoughData,
    insights,
    suggestedDrills,
    domainPerformance,
    contextAnalysis,
  };
}
