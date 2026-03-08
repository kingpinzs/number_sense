// Coaching Insight Templates — Data-driven coaching messages
// Each template evaluates user state and builds a specific, actionable message
// These are the "basketball coach" messages: targeted, data-backed, personal

import type { CoachMessage, CoachUserState } from '../types';
import { getModuleDisplayName } from './coachMessages';
import { selectRealWorldTip } from './realWorldTips';

export interface CoachingInsight {
  id: string;
  triggerId: string;
  evaluate: (state: CoachUserState) => boolean;
  build: (state: CoachUserState) => CoachMessage;
  priority: number;
}

// Human-readable mistake descriptions for error pattern coaching
const MISTAKE_DESCRIPTIONS: Record<string, string> = {
  overestimation: 'place numbers too high on the line',
  underestimation: 'place numbers too low on the line',
  magnitude_error: 'misjudge how big numbers are',
  boundary_error: 'struggle with numbers near the edges (0 or max)',
  rotation_confusion: 'mix up rotation angles (90° vs 180°)',
  mirror_confusion: 'confuse mirrored shapes with rotated ones',
  complexity_threshold: 'get tripped up by complex shapes',
  operation_weakness: 'make errors on certain operations',
  magnitude_threshold: 'struggle when numbers get larger',
  speed_accuracy_tradeoff: 'rush and make mistakes',
};

const MISTAKE_ADVICE: Record<string, string> = {
  overestimation: 'Try anchoring: find the midpoint first, then decide which half your number is in.',
  underestimation: 'Before placing, ask "is this number in the top half or bottom half of the range?"',
  magnitude_error: 'Practice by placing 10, 50, and 90 first to build reference points on the line.',
  boundary_error: 'Numbers near 0 and the max are tricky — use the middle as your anchor and work outward.',
  rotation_confusion: 'Focus on one corner of the shape and track where it moves — that reveals the rotation.',
  mirror_confusion: "Check the shape's handedness: if a feature that was on the left is now on the right, it's mirrored.",
  complexity_threshold: 'Break complex shapes into simple parts — track just one distinctive feature through the rotation.',
  operation_weakness: 'Break problems into steps: for 13-7, think 13-3=10, then 10-4=6.',
  magnitude_threshold: 'Split big numbers: for 47+38, think 40+30=70, then 7+8=15, so 85.',
  speed_accuracy_tradeoff: "You're fast — now channel that speed into checking. Pause 1 second before submitting.",
};

export const COACHING_INSIGHTS: CoachingInsight[] = [
  // Priority 8: Weak module focus — most actionable coaching message
  {
    id: 'coaching-weak-module',
    triggerId: 'weak-module-focus',
    priority: 8,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      return Object.entries(state.modulePerformance).some(
        ([, perf]) => perf.recentAccuracy !== null && perf.recentAccuracy < 60 && perf.drillCount >= 3
      );
    },
    build: (state) => {
      const entries = Object.entries(state.modulePerformance!);
      const weakest = entries
        .filter(([, p]) => p.recentAccuracy !== null && p.drillCount >= 3)
        .sort((a, b) => (a[1].recentAccuracy ?? 100) - (b[1].recentAccuracy ?? 100))[0];
      const [mod, perf] = weakest;
      const name = getModuleDisplayName(mod);
      return {
        id: 'coaching-weak-module',
        triggerId: 'weak-module-focus',
        title: `Focus Area: ${name}`,
        message: `Your ${name} accuracy is at ${Math.round(perf.recentAccuracy!)}%. Let's concentrate there — that's where the biggest gains are.`,
        icon: '🎯',
        priority: 8,
        detail: 'Focused practice on your weakest area produces the fastest improvement.',
        action: { label: 'Train Now', route: '/training' },
      };
    },
  },

  // Priority 9: Module improving — celebrate specific progress
  {
    id: 'coaching-module-improving',
    triggerId: 'module-improving',
    priority: 9,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      return Object.values(state.modulePerformance).some(
        p => p.trend === 'improving' && p.drillCount >= 5
      );
    },
    build: (state) => {
      const improving = Object.entries(state.modulePerformance!)
        .filter(([, p]) => p.trend === 'improving' && p.drillCount >= 5)
        .sort((a, b) => (b[1].recentAccuracy ?? 0) - (a[1].recentAccuracy ?? 0))[0];
      const [mod, perf] = improving;
      const name = getModuleDisplayName(mod);
      return {
        id: 'coaching-module-improving',
        triggerId: 'module-improving',
        title: `${name} Is Clicking!`,
        message: `Your ${name} skills are trending upward at ${Math.round(perf.recentAccuracy ?? 0)}%. Your brain is building those pathways.`,
        icon: '📈',
        priority: 9,
        detail: 'Consistent practice creates stronger neural connections over time.',
      };
    },
  },

  // Priority 10: Module declining — supportive redirect
  {
    id: 'coaching-module-declining',
    triggerId: 'module-declining',
    priority: 10,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      return Object.values(state.modulePerformance).some(
        p => p.trend === 'declining' && p.drillCount >= 5
      );
    },
    build: (state) => {
      const declining = Object.entries(state.modulePerformance!)
        .filter(([, p]) => p.trend === 'declining' && p.drillCount >= 5)
        .sort((a, b) => (a[1].recentAccuracy ?? 100) - (b[1].recentAccuracy ?? 100))[0];
      const [mod] = declining;
      const name = getModuleDisplayName(mod);
      return {
        id: 'coaching-module-declining',
        triggerId: 'module-declining',
        title: `${name} Needs Attention`,
        message: `Your ${name} scores have dipped recently. No stress — let's slow down and rebuild from the basics.`,
        icon: '💬',
        priority: 10,
        detail: 'Dips are normal. They often happen right before a breakthrough.',
        action: { label: 'Practice Now', route: '/training' },
      };
    },
  },

  // Priority 11: Error pattern detection — targeted correction
  {
    id: 'coaching-error-pattern',
    triggerId: 'error-pattern',
    priority: 11,
    evaluate: (state) => {
      return state.errorPatterns.length > 0 && state.errorPatterns[0].frequency >= 0.3;
    },
    build: (state) => {
      const pattern = state.errorPatterns[0];
      const name = getModuleDisplayName(pattern.module);
      const description = MISTAKE_DESCRIPTIONS[pattern.mistakeType] ?? 'make errors';
      const advice = MISTAKE_ADVICE[pattern.mistakeType] ?? 'Take your time and double-check before submitting.';
      return {
        id: 'coaching-error-pattern',
        triggerId: 'error-pattern',
        title: `Pattern Spotted in ${name}`,
        message: `I notice you tend to ${description}. ${advice}`,
        icon: '🔍',
        priority: 11,
        detail: `This pattern appeared in ${Math.round(pattern.frequency * 100)}% of recent drills.`,
      };
    },
  },

  // Priority 12: Automaticity — speed improving without accuracy drop
  {
    id: 'coaching-automaticity',
    triggerId: 'automaticity',
    priority: 12,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      // Need at least one module with good accuracy and measured response time
      return Object.values(state.modulePerformance).some(
        p => p.recentAccuracy !== null && p.recentAccuracy >= 70 &&
             p.avgResponseTime !== null && p.avgResponseTime < 5000 &&
             p.drillCount >= 6
      );
    },
    build: (state) => {
      const fast = Object.entries(state.modulePerformance!)
        .filter(([, p]) => p.recentAccuracy !== null && p.recentAccuracy >= 70 &&
                           p.avgResponseTime !== null && p.drillCount >= 6)
        .sort((a, b) => (a[1].avgResponseTime ?? Infinity) - (b[1].avgResponseTime ?? Infinity))[0];
      const [mod, perf] = fast;
      const name = getModuleDisplayName(mod);
      const seconds = ((perf.avgResponseTime ?? 0) / 1000).toFixed(1);
      return {
        id: 'coaching-automaticity',
        triggerId: 'automaticity',
        title: `${name}: Getting Automatic!`,
        message: `Averaging ${seconds}s per answer at ${Math.round(perf.recentAccuracy!)}% accuracy. Neural pathways are strengthening!`,
        icon: '🧠',
        priority: 12,
        detail: 'When answers come faster without losing accuracy, your brain is building automaticity.',
      };
    },
  },

  // Priority 13: Confidence gap — scores say you're better than you feel
  {
    id: 'coaching-confidence-gap',
    triggerId: 'confidence-gap',
    priority: 13,
    evaluate: (state) => {
      return state.recentAccuracy !== null && state.recentAccuracy >= 70 &&
             state.confidenceAfter !== null && state.confidenceAfter < 3;
    },
    build: (state) => {
      return {
        id: 'coaching-confidence-gap',
        triggerId: 'confidence-gap',
        title: 'Better Than You Think',
        message: `Your scores say you're at ${Math.round(state.recentAccuracy!)}% accuracy — that's solid! Trust the data, not the doubt.`,
        icon: '💡',
        priority: 13,
        detail: 'Dyscalculia often makes you underestimate your ability. The numbers tell the real story.',
      };
    },
  },

  // Priority 14: Spacing advice — practice is clustered
  {
    id: 'coaching-spacing',
    triggerId: 'spacing-advice',
    priority: 14,
    evaluate: (state) => {
      return state.spacingQuality === 'clustered';
    },
    build: (_state) => {
      return {
        id: 'coaching-spacing',
        triggerId: 'spacing-advice',
        title: 'Spread Your Practice',
        message: 'Your sessions are bunched together. Spreading them across the week helps your brain consolidate — try every other day.',
        icon: '📅',
        priority: 14,
        detail: 'Research shows spaced practice produces 2x better retention than cramming.',
      };
    },
  },

  // Priority 15: Difficulty ready — accuracy is high, ready for a challenge
  {
    id: 'coaching-difficulty-ready',
    triggerId: 'difficulty-ready',
    priority: 15,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      return Object.values(state.modulePerformance).some(
        p => p.recentAccuracy !== null && p.recentAccuracy >= 85 && p.drillCount >= 5
      );
    },
    build: (state) => {
      const ready = Object.entries(state.modulePerformance!)
        .filter(([, p]) => p.recentAccuracy !== null && p.recentAccuracy >= 85 && p.drillCount >= 5)
        .sort((a, b) => (b[1].recentAccuracy ?? 0) - (a[1].recentAccuracy ?? 0))[0];
      const [mod, perf] = ready;
      const name = getModuleDisplayName(mod);
      return {
        id: 'coaching-difficulty-ready',
        triggerId: 'difficulty-ready',
        title: `Ready for a Challenge?`,
        message: `You're at ${Math.round(perf.recentAccuracy!)}% on ${name} — ready to step up? Harder problems build stronger pathways.`,
        icon: '🚀',
        priority: 15,
        action: { label: 'Train Now', route: '/training' },
      };
    },
  },

  // Priority 16: Slow and accurate — encouragement for deliberate approach
  {
    id: 'coaching-slow-accurate',
    triggerId: 'slow-and-accurate',
    priority: 16,
    evaluate: (state) => {
      if (!state.modulePerformance) return false;
      return Object.values(state.modulePerformance).some(
        p => p.recentAccuracy !== null && p.recentAccuracy >= 75 &&
             p.avgResponseTime !== null && p.avgResponseTime > 8000 &&
             p.drillCount >= 3
      );
    },
    build: (state) => {
      const slow = Object.entries(state.modulePerformance!)
        .filter(([, p]) => p.recentAccuracy !== null && p.recentAccuracy >= 75 &&
                           p.avgResponseTime !== null && p.avgResponseTime > 8000)
        .sort((a, b) => (b[1].avgResponseTime ?? 0) - (a[1].avgResponseTime ?? 0))[0];
      const [mod, perf] = slow;
      const name = getModuleDisplayName(mod);
      return {
        id: 'coaching-slow-accurate',
        triggerId: 'slow-and-accurate',
        title: `Thoughtful ${name} Work`,
        message: `Taking your time on ${name} is paying off — ${Math.round(perf.recentAccuracy!)}% accuracy! Speed comes naturally as pathways strengthen.`,
        icon: '🐢',
        priority: 16,
        detail: 'Accuracy first, speed second. Your brain is building the right foundations.',
      };
    },
  },

  // Priority 17: Real-world activity tip
  {
    id: 'coaching-real-world-tip',
    triggerId: 'real-world-tip',
    priority: 17,
    evaluate: (state) => {
      // Always eligible — selectRealWorldTip handles filtering
      return state.hasAssessment && state.trainingSessionCount >= 1;
    },
    build: (state) => {
      const weakestAccuracy = state.modulePerformance && state.weakestModule
        ? state.modulePerformance[state.weakestModule]?.recentAccuracy ?? null
        : null;

      const tip = selectRealWorldTip(
        state.weakestModule,
        state.shownRealWorldTipIds,
        weakestAccuracy,
      );

      if (!tip) {
        // All tips shown — generic encouragement
        return {
          id: 'coaching-real-world-tip-done',
          triggerId: 'real-world-tip',
          title: 'Keep Practicing in the Real World',
          message: "You've seen all our activity tips! Keep applying math in daily life — every moment counts.",
          icon: '🌍',
          priority: 17,
        };
      }

      return {
        id: `coaching-rwt-${tip.id}`,
        triggerId: 'real-world-tip',
        title: `Try This: ${tip.title}`,
        message: tip.activity,
        icon: '🌍',
        priority: 17,
        detail: tip.why,
      };
    },
  },
];
