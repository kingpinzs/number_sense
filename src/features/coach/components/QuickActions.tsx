// QuickActions - Story 6.2
// Dynamic quick action cards for the home screen
// Renders 2-4 action cards based on user state

import { motion, useReducedMotion } from 'framer-motion';
import { Dumbbell, Target, TrendingUp, Sparkles, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useQuickActions } from '../hooks/useQuickActions';
import type { QuickAction } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  Target,
  TrendingUp,
  Sparkles,
  Brain,
};

const COLOR_MAP = {
  primary: { border: 'border-l-primary', bg: 'bg-primary/10', text: 'text-primary' },
  secondary: { border: 'border-l-secondary', bg: 'bg-secondary/10', text: 'text-secondary' },
  accent: { border: 'border-l-accent', bg: 'bg-accent/10', text: 'text-accent' },
} as const;

export default function QuickActions() {
  const { actions, isLoading, handleActionClick } = useQuickActions();
  const shouldReduceMotion = useReducedMotion();

  if (isLoading || actions.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Quick actions"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {actions.map((action) => (
        <QuickActionCard
          key={action.id}
          action={action}
          onClick={() => handleActionClick(action)}
          reduceMotion={!!shouldReduceMotion}
        />
      ))}
    </div>
  );
}

interface QuickActionCardProps {
  action: QuickAction;
  onClick: () => void;
  reduceMotion: boolean;
}

function QuickActionCard({ action, onClick, reduceMotion }: QuickActionCardProps) {
  const IconComponent = ICON_MAP[action.icon] ?? Dumbbell;
  const colors = COLOR_MAP[action.color];

  return (
    <motion.div
      {...(!reduceMotion && { whileHover: { y: -2 } })}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`cursor-pointer border-l-4 ${colors.border} transition-colors hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
        onClick={onClick}
        tabIndex={0}
        role="link"
        aria-label={`${action.title}: ${action.subtitle}`}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
            <IconComponent className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{action.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{action.subtitle}</p>
            {action.badge !== undefined && action.badge > 0 && (
              <span className="mt-1 inline-flex items-center rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary">
                {action.badge} new
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
