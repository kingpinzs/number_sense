// MilestoneModal - Celebration dialog for streak milestones
// Story 5.3: Shows confetti animation when user hits a milestone

import { motion, useReducedMotion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import type { Milestone } from '@/services/training/streakManager';

interface MilestoneModalProps {
  milestone: Milestone;
  open: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#E87461', '#FFD700', '#4ECDC4', '#FF6B9D'];

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.cos((i * 30 * Math.PI) / 180) * 120,
  y: Math.sin((i * 30 * Math.PI) / 180) * 120,
  color: CONFETTI_COLORS[i % 4],
}));

export function MilestoneModal({ milestone, open, onClose }: MilestoneModalProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm text-center" data-testid="milestone-modal">
        {/* Confetti particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              data-testid="confetti-particle"
              className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={shouldReduceMotion ? {} : {
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
                scale: [0, 1.5, 0.5],
              }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
            />
          ))}
        </div>

        <DialogHeader className="items-center">
          <motion.div
            className="text-6xl mb-2"
            initial={{ scale: shouldReduceMotion ? 1 : 0 }}
            animate={shouldReduceMotion ? {} : { scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {milestone.emoji}
          </motion.div>
          <DialogTitle className="text-2xl">
            {milestone.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {milestone.message}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 text-4xl font-bold text-primary">
          {milestone.type === 'accuracy'
            ? `${milestone.streak}%`
            : `${milestone.streak} Days`}
        </div>
      </DialogContent>
    </Dialog>
  );
}
