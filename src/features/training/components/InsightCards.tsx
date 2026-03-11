// InsightCards - Renders a list of insights as compact animated cards
// Each card shows an icon based on type, title, message, and optional action button
// Cards have colored left borders based on insight type and stagger-animate in

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Star,
  Lightbulb,
  Trophy,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { Insight, InsightType } from '@/services/training/insightTypes';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightCardsProps {
  insights: Insight[];
  maxCards?: number;
}

// ─── Icon mapping by insight type ─────────────────────────────────────────────

const INSIGHT_ICONS: Record<InsightType, React.ComponentType<{ className?: string }>> = {
  trend: TrendingUp,
  weakness: Target,
  strength: Star,
  discovery: Lightbulb,
  recommendation: Lightbulb,
  milestone: Trophy,
};

// ─── Left border color mapping by insight type ────────────────────────────────

const BORDER_COLORS: Record<InsightType, string> = {
  strength: 'border-l-green-500',
  weakness: 'border-l-yellow-500',
  trend: 'border-l-blue-500',
  recommendation: 'border-l-primary',
  discovery: 'border-l-purple-500',
  milestone: 'border-l-yellow-500',
};

// ─── Animation variants for staggered entry ───────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

function InsightCards({ insights, maxCards = 3 }: InsightCardsProps) {
  const visibleInsights = insights.slice(0, maxCards);

  if (visibleInsights.length === 0) {
    return (
      <div
        data-testid="insight-cards"
        className="text-center py-6 text-sm text-muted-foreground"
      >
        Keep practicing to unlock insights
      </div>
    );
  }

  return (
    <motion.div
      data-testid="insight-cards"
      className="flex flex-col gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {visibleInsights.map((insight) => {
        const Icon = INSIGHT_ICONS[insight.type];
        const borderColor = BORDER_COLORS[insight.type];

        return (
          <motion.div
            key={insight.id}
            data-testid="insight-card"
            variants={cardVariants}
            className={`rounded-lg border border-l-4 ${borderColor} bg-card p-3 shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">
                  {insight.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.message}
                </p>
                {insight.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 min-h-[44px]"
                    data-testid="insight-action-button"
                  >
                    {insight.action.label}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default InsightCards;
