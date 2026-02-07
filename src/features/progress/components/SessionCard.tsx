// SessionCard Component - Story 5.2
// Displays a single training session with expandable drill breakdown

import React from 'react';
import { Check, X } from 'lucide-react';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/shared/components/ui/accordion';
import { formatSessionDate, formatSessionTime, formatDuration } from '../utils/dateFormatters';
import type { SessionWithDrills } from '../hooks/useSessionHistory';

const MODULE_DISPLAY: Record<string, { label: string; icon: string }> = {
  'number_line': { label: 'Number Line', icon: '📏' },
  'spatial_rotation': { label: 'Spatial Rotation', icon: '🔄' },
  'math_operations': { label: 'Math Operations', icon: '➕' },
};

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-green-100 text-green-800';
  if (accuracy >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function getAccuracyLabel(accuracy: number): string {
  if (accuracy >= 80) return 'Good';
  if (accuracy >= 60) return 'Fair';
  return 'Needs work';
}

function formatConfidenceChange(change: number | undefined): { text: string; emoji: string; color: string; srLabel: string } {
  if (change == null || !Number.isFinite(change) || change === 0) return { text: 'No change', emoji: '😐', color: 'text-gray-500', srLabel: 'No confidence change' };
  if (change > 0) return { text: `+${change}`, emoji: '😊', color: 'text-emerald-600', srLabel: `Confidence increased by ${change}` };
  return { text: `${change}`, emoji: '😟', color: 'text-red-500', srLabel: `Confidence decreased by ${Math.abs(change)}` };
}

function getModuleBreakdown(drills: SessionWithDrills['drills']): string {
  const counts: Record<string, number> = {};
  for (const drill of drills) {
    const label = MODULE_DISPLAY[drill.module]?.label || drill.module;
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => `${count} ${label}`)
    .join(', ');
}

interface SessionCardProps {
  session: SessionWithDrills;
  index: number;
}

const SessionCard = React.memo(function SessionCard({ session, index }: SessionCardProps) {
  const accuracy = session.accuracy ?? 0;
  const confidenceInfo = formatConfidenceChange(session.confidenceChange);
  const drillBreakdown = getModuleBreakdown(session.drills);
  const drillCountText = `${session.drillCount ?? session.drills.length} drills`;

  return (
    <AccordionItem
      value={`session-${session.id ?? index}`}
      className="border rounded-lg shadow-sm p-0 mb-2"
    >
      <AccordionTrigger
        className="px-4 py-3 hover:no-underline min-h-[44px]"
        aria-label={`Session on ${formatSessionDate(session.timestamp)} at ${formatSessionTime(session.timestamp)}, ${drillCountText}, ${accuracy}% accuracy`}
      >
        <div className="flex flex-col items-start gap-1 w-full text-left">
          {/* Row 1: Date, Time, Duration */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{formatSessionDate(session.timestamp)}</span>
            <span className="text-muted-foreground">{formatSessionTime(session.timestamp)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDuration(session.duration)}</span>
          </div>

          {/* Row 2: Drill count, Accuracy badge, Confidence change */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {drillCountText}
              {drillBreakdown && (
                <span className="hidden sm:inline"> ({drillBreakdown})</span>
              )}
            </span>

            {/* Accuracy Badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 h-6 text-xs font-medium ${getAccuracyColor(accuracy)}`}
            >
              {accuracy}%
              <span className="sr-only"> - {getAccuracyLabel(accuracy)}</span>
            </span>

            {/* Confidence Change */}
            <span className={`inline-flex items-center gap-1 text-sm ${confidenceInfo.color}`}>
              <span aria-hidden="true">{confidenceInfo.emoji}</span>
              <span>{confidenceInfo.text}</span>
              <span className="sr-only">{confidenceInfo.srLabel}</span>
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4">
        {/* Drill-by-drill breakdown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Drill Breakdown
            </h4>
            {session.hasMagicMinute && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 h-5">
                <span aria-hidden="true">⚡</span>
                Magic Minute
              </span>
            )}
          </div>
          {session.drills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drill details available</p>
          ) : (
            <ul className="space-y-1" role="list">
              {session.drills.map((drill, i) => {
                const moduleInfo = MODULE_DISPLAY[drill.module] || { label: drill.module, icon: '❓' };
                const timeSeconds = Math.round(drill.timeToAnswer / 1000);

                return (
                  <li
                    key={drill.id ?? i}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    <span aria-hidden="true">{moduleInfo.icon}</span>
                    {drill.problem && <span className="sr-only">{moduleInfo.label}</span>}
                    <span className="flex-1">{drill.problem || moduleInfo.label}</span>
                    <span className="text-muted-foreground">{timeSeconds}s</span>
                    {drill.isCorrect ? (
                      <Check className="h-4 w-4 text-green-600" aria-label="Correct" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" aria-label="Incorrect" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});

export default SessionCard;
