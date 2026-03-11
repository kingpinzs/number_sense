// SuggestedPractice - Main section showing insights, suggested drills,
// domain progress, and all drills grid below the training session card
// Mobile-first layout with skeleton loading states and 44px touch targets

import { motion } from 'framer-motion';
import {
  Sparkles,
  Target,
  BarChart3,
  Grid3X3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Star,
} from 'lucide-react';
import { Progress } from '@/shared/components/ui/progress';
import InsightCards from './InsightCards';
import type { InsightEngineResult } from '@/services/training/insightTypes';
import {
  DOMAIN_LABELS,
  DRILL_LABELS,
  DRILL_TO_DOMAIN,
} from '@/services/training/insightTypes';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SuggestedPracticeProps {
  /** The full engine result (may be null while loading or no data) */
  result: InsightEngineResult | null;
  /** Whether the engine is still loading */
  loading?: boolean;
  /** Callback when user selects a drill to practice */
  onDrillSelect?: (drillType: string, difficulty: 'easy' | 'medium' | 'hard') => void;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse" data-testid="skeleton-card">
      <div className="h-4 w-3/4 bg-muted rounded mb-3" />
      <div className="h-3 w-full bg-muted rounded mb-2" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  hard: 'bg-red-500/10 text-red-500',
};

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[difficulty]}`}
      data-testid="difficulty-badge"
    >
      {difficulty}
    </span>
  );
}

// ─── Domain badge ─────────────────────────────────────────────────────────────

function DomainBadge({ domain }: { domain: string }) {
  const label = DOMAIN_LABELS[domain] || domain;
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary"
      data-testid="domain-badge"
    >
      {label}
    </span>
  );
}

// ─── Trend arrow ──────────────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span data-testid="trend-up">
        <TrendingUp className="h-4 w-4 text-green-500" aria-label="Improving" />
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span data-testid="trend-down">
        <TrendingDown className="h-4 w-4 text-red-500" aria-label="Declining" />
      </span>
    );
  }
  return (
    <span data-testid="trend-neutral">
      <Minus className="h-4 w-4 text-muted-foreground" aria-label="Stable" />
    </span>
  );
}

// ─── Progress bar color based on accuracy ─────────────────────────────────────

function getProgressColor(accuracy: number): string {
  if (accuracy >= 70) return 'var(--color-green-500, #22c55e)';
  if (accuracy >= 50) return 'var(--color-yellow-500, #eab308)';
  return 'var(--color-red-500, #ef4444)';
}

// ─── Animation variants ──────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

function SuggestedPractice({ result, loading = false, onDrillSelect }: SuggestedPracticeProps) {
  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div data-testid="suggested-practice" className="px-6 space-y-4 mt-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // ── Derived data (safe even when result is null) ─────────────────────────
  const hasData = result && result.hasEnoughData;
  const insights = result?.insights ?? [];
  const suggestedDrills = result?.suggestedDrills ?? [];
  const domainPerformance = result?.domainPerformance ?? [];
  const hasInsights = insights.length > 0;

  // Sort suggested drills: weakness-related first (by priority descending), limit to 5
  const sortedDrills = [...suggestedDrills]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  // Build a set of suggested drill types for highlighting in the "All Drills" grid
  const suggestedDrillTypes = new Set(suggestedDrills.map((d) => d.drillType));

  // Domains with drills completed (skip 0-drill domains)
  const activeDomains = domainPerformance.filter((dp) => dp.totalDrills > 0);

  // Build domain performance lookup for "All Drills" difficulty inference
  const domainPerfMap = new Map(
    domainPerformance.map((dp) => [dp.domain, dp]),
  );

  // All 18 training drill types from DRILL_LABELS
  const allDrillTypes = Object.keys(DRILL_LABELS);

  return (
    <div data-testid="suggested-practice" className="px-6 space-y-6 mt-6">
      {/* ── Not enough data banner (shows above drills when no insights yet) */}
      {!hasData && (
        <div className="rounded-xl border bg-card p-6 text-center" data-testid="not-enough-data">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Complete more drills to unlock personalized suggestions
          </p>
        </div>
      )}

      {/* ── 1. Insights Section ─────────────────────────────────────────── */}
      {hasData && hasInsights && (
        <motion.section
          data-testid="insights-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Your Insights</h2>
          </div>

          <InsightCards insights={insights} maxCards={3} />
        </motion.section>
      )}

      {/* ── 2. Suggested For You Section ────────────────────────────────── */}
      {hasData && sortedDrills.length > 0 && (
        <motion.section
          data-testid="suggested-drills-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Suggested For You</h2>
          </div>

          <div className="flex flex-col gap-3">
            {sortedDrills.map((drill) => (
              <button
                key={drill.drillType}
                className="rounded-xl border bg-card p-4 text-left hover:bg-accent transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
                onClick={() => onDrillSelect?.(drill.drillType, drill.difficulty)}
                aria-label={`Start ${drill.name}`}
                data-testid="suggested-drill-card"
              >
                <p className="font-semibold text-sm">{drill.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <DomainBadge domain={drill.domain} />
                  <DifficultyBadge difficulty={drill.difficulty} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                  {drill.reason}
                </p>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── 3. Domain Progress Section ──────────────────────────────────── */}
      {activeDomains.length > 0 && (
        <motion.section
          data-testid="domain-progress-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Domain Progress</h2>
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-4">
            {activeDomains.map((dp) => (
              <div key={dp.domain} data-testid="domain-progress-item">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{dp.domainLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">
                      {Math.round(dp.recentAccuracy)}%
                    </span>
                    <TrendArrow trend={dp.trend} />
                  </div>
                </div>
                <Progress
                  value={dp.recentAccuracy}
                  className="h-2"
                  style={{
                    '--progress-background': getProgressColor(dp.recentAccuracy),
                  } as React.CSSProperties}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dp.totalDrills} {dp.totalDrills === 1 ? 'drill' : 'drills'} completed
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── 4. All Drills — always visible ──────────────────────────────── */}
      <motion.section
        data-testid="all-drills-section"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">All Drills</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {allDrillTypes.map((drillType) => {
            const domain = DRILL_TO_DOMAIN[drillType] || '';
            const drillLabel = DRILL_LABELS[drillType] || drillType;
            const domainLabel = DOMAIN_LABELS[domain] || domain;
            const perf = domainPerfMap.get(domain);
            const suggestedDifficulty = perf?.currentDifficulty || 'easy';
            const isSuggested = suggestedDrillTypes.has(drillType);

            return (
              <button
                key={drillType}
                className={`rounded-lg border bg-card p-3 text-left hover:bg-accent transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSuggested ? 'ring-1 ring-primary/50' : ''
                }`}
                onClick={() => onDrillSelect?.(drillType, suggestedDifficulty)}
                aria-label={`Start ${drillLabel}`}
                data-testid="all-drill-card"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight">{drillLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{domainLabel}</p>
                  </div>
                  {isSuggested && (
                    <Star
                      className="h-3 w-3 text-primary shrink-0 mt-0.5 fill-primary"
                      data-testid="suggested-star"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

export default SuggestedPractice;
