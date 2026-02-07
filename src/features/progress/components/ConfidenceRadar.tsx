// ConfidenceRadar Component - Story 5.1
// Radar chart visualization of confidence across 3 domains
// Architecture: Recharts RadarChart with responsive sizing

import { useMemo, useState, useEffect, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DomainConfidence } from '../services/confidenceCalculator';

/**
 * Chart sizes per viewport (AC-3)
 */
const CHART_SIZE = {
  mobile: 280,
  tablet: 400,
} as const;

/**
 * Hook to detect tablet+ viewport (768px+)
 */
function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsTablet(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isTablet;
}

/**
 * Data point format for RadarChart
 */
interface RadarDataPoint {
  domain: string;
  current: number;
  baseline: number;
  fullMark: number;
}

/**
 * Color constants from UX Spec
 */
const COLORS = {
  coral: '#E87461',
  coralLight: 'rgba(232, 116, 97, 0.5)',
  gray: '#9CA3AF',
  gridLine: '#E5E7EB',
};

/**
 * Domain display names
 */
const DOMAIN_LABELS: Record<keyof DomainConfidence, string> = {
  numberSense: 'Number Sense',
  spatial: 'Spatial Awareness',
  operations: 'Math Operations',
};

interface ConfidenceRadarProps {
  /** Current confidence scores (1-5 per domain) */
  current: DomainConfidence;
  /** Baseline confidence scores from first session (1-5 per domain) */
  baseline: DomainConfidence | null;
}

/**
 * ConfidenceRadar - Radar/spider chart showing confidence across domains
 *
 * Displays:
 * - 3 axes: Number Sense (top), Spatial Awareness (bottom-right), Math Operations (bottom-left)
 * - Current values as coral filled area
 * - Baseline as dashed gray line
 * - Scale 1-5 on each axis
 *
 * Responsive sizing (AC-3):
 * - Mobile: 280px height
 * - Tablet+: 400px height
 */
function ConfidenceRadar({
  current,
  baseline,
}: ConfidenceRadarProps) {
  // Responsive height: 280px mobile, 400px tablet+
  const isTablet = useIsTablet();
  const chartHeight = isTablet ? CHART_SIZE.tablet : CHART_SIZE.mobile;

  // Respect prefers-reduced-motion (Task 8)
  const shouldReduceMotion = useReducedMotion();

  // Transform domain data to RadarChart format
  const chartData: RadarDataPoint[] = useMemo(() => {
    return [
      {
        domain: DOMAIN_LABELS.numberSense,
        current: current.numberSense,
        baseline: baseline?.numberSense ?? current.numberSense,
        fullMark: 5,
      },
      {
        domain: DOMAIN_LABELS.spatial,
        current: current.spatial,
        baseline: baseline?.spatial ?? current.spatial,
        fullMark: 5,
      },
      {
        domain: DOMAIN_LABELS.operations,
        current: current.operations,
        baseline: baseline?.operations ?? current.operations,
        fullMark: 5,
      },
    ];
  }, [current, baseline]);

  // Generate accessible alt text
  const altText = useMemo(() => {
    return `Confidence Radar: Number Sense ${current.numberSense.toFixed(1)}, Spatial Awareness ${current.spatial.toFixed(1)}, Math Operations ${current.operations.toFixed(1)}`;
  }, [current]);

  return (
    <motion.div
      role="img"
      aria-label={altText}
      className="w-full"
      data-testid="confidence-radar"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          {/* Grid lines at 1, 2, 3, 4, 5 intervals */}
          <PolarGrid stroke={COLORS.gridLine} />

          {/* Domain labels - 18px font positioned outside */}
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fontSize: 14, fill: '#374151' }}
          />

          {/* Scale 1-5 */}
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
          />

          {/* Baseline - dashed gray line (rendered first, behind current) */}
          {baseline && (
            <Radar
              name="Starting Point"
              dataKey="baseline"
              fill="none"
              stroke={COLORS.gray}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}

          {/* Current values - coral filled area */}
          <Radar
            name="Current"
            dataKey="current"
            fill={COLORS.coral}
            fillOpacity={0.5}
            stroke={COLORS.coral}
            strokeWidth={2}
          />

          {/* Legend showing Current vs Starting Point */}
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// Wrap in React.memo for performance optimization
export default memo(ConfidenceRadar);

/**
 * Empty state placeholder for ConfidenceRadar (AC-4)
 * Shown when user has completed fewer than 3 training sessions
 */
export function ConfidenceRadarEmpty() {
  const isTablet = useIsTablet();
  const chartHeight = isTablet ? CHART_SIZE.tablet : CHART_SIZE.mobile;

  // Placeholder data for empty gray outline
  const emptyData: RadarDataPoint[] = [
    { domain: DOMAIN_LABELS.numberSense, current: 0, baseline: 0, fullMark: 5 },
    { domain: DOMAIN_LABELS.spatial, current: 0, baseline: 0, fullMark: 5 },
    { domain: DOMAIN_LABELS.operations, current: 0, baseline: 0, fullMark: 5 },
  ];

  return (
    <div
      className="w-full flex flex-col items-center"
      data-testid="confidence-radar-empty"
    >
      {/* Empty state message */}
      <p className="text-center text-gray-600 mb-4 px-4">
        Complete 3 training sessions to see your Confidence Radar!
      </p>

      {/* Gray outline chart (no filled area) */}
      <div className="w-full opacity-50">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <RadarChart data={emptyData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke={COLORS.gridLine} />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fontSize: 14, fill: '#9CA3AF' }}
            />
            <PolarRadiusAxis
              domain={[0, 5]}
              tickCount={6}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
            />
            {/* Gray outline only, no fill */}
            <Radar
              name="Confidence"
              dataKey="current"
              fill="none"
              stroke={COLORS.gray}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
