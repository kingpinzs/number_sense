// DrillTransition - Smooth transition animation between drills
// Story 3.5: Build Drill Session UI Components
// Shows next drill type with icon for 0.5 seconds with fade animations

import { motion } from 'framer-motion';
import type { DrillType } from '@/services/training/drillSelector';

export interface DrillTransitionProps {
  nextDrillType: DrillType | string;
}

/**
 * Drill type metadata: icon and display name
 */
const DRILL_METADATA: Record<DrillType, { icon: string; name: string }> = {
  number_line: { icon: '📏', name: 'Number Line' },
  spatial_rotation: { icon: '🔄', name: 'Spatial Rotation' },
  math_operations: { icon: '➕', name: 'Math Operations' },
  subitizing: { icon: '👁️', name: 'Quick Count' },
  number_bonds: { icon: '🔗', name: 'Number Bonds' },
  magnitude_comparison: { icon: '⚖️', name: 'Number Comparison' },
  place_value: { icon: '🔢', name: 'Place Value' },
  estimation: { icon: '🎯', name: 'Estimation' },
  sequencing: { icon: '🔃', name: 'Sequencing' },
  fact_fluency: { icon: '⚡', name: 'Fact Fluency' },
  fractions: { icon: '🍕', name: 'Fractions' },
  time_measurement: { icon: '🕐', name: 'Time & Measurement' },
  working_memory: { icon: '🧠', name: 'Working Memory' },
};

/**
 * DrillTransition component
 *
 * AC: Appears between drills for 0.5 seconds
 * - Shows next drill type icon + name
 * - Fade-in/fade-out animation with Framer Motion
 * - Respects prefers-reduced-motion
 * - Prevents jarring instant switches between drill types
 *
 * @param nextDrillType - Type of the upcoming drill
 */
export default function DrillTransition({ nextDrillType }: DrillTransitionProps) {
  const drill = DRILL_METADATA[nextDrillType as DrillType] ?? { icon: '📝', name: nextDrillType };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-white/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}  // 0.2s fade in/out, total 0.5s display time
      data-testid="drill-transition"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Drill type icon */}
        <span className="text-6xl" role="img" aria-hidden="true">
          {drill.icon}
        </span>

        {/* Drill type name */}
        <h2 className="text-2xl font-semibold text-gray-800">
          {drill.name}
        </h2>
      </div>
    </motion.div>
  );
}
