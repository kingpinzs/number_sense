// CoachCard - Story 6.1
// Displays contextual coach guidance with dismiss and action buttons
// Uses shadcn/ui Card, Framer Motion fade-in, prefers-reduced-motion

import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { CoachMessage } from '../types';

interface CoachCardProps {
  guidance: CoachMessage | null;
  onDismiss: () => void;
}

export default function CoachCard({ guidance, onDismiss }: CoachCardProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  if (!guidance) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={guidance.id}
        initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="relative mb-6 border-secondary/30"
          role="region"
          aria-label="Coach guidance"
        >
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Dismiss coach tip"
          >
            <X className="h-4 w-4" />
          </button>

          <CardHeader className="pr-12">
            <CardTitle className="flex items-center gap-2 text-base">
              <span role="img" aria-hidden="true">{guidance.icon}</span>
              {guidance.title}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">{guidance.message}</p>

            {guidance.detail && (
              <p className="mt-1 text-xs text-muted-foreground/70 italic">{guidance.detail}</p>
            )}

            {guidance.action && (
              <Button
                size="lg"
                className="mt-4 min-h-[48px]"
                onClick={() => navigate(guidance.action!.route)}
              >
                {guidance.action.label}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
