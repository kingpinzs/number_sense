// ExperimentDashboard.tsx - Story 8.3: Build Experiment Results Dashboard
// Dev-only dashboard for viewing A/B experiment results
// Architecture:
//   List view: sorts EXPERIMENTS, loads observation counts from Dexie
//   Detail view: loads observations, groups by metric/variant, calls statsCalculator

import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EXPERIMENTS, type ExperimentDefinition } from '@/services/research/experiments';
import { compareVariants } from '@/services/research/statsCalculator';
import { exportObservationsAsCSV } from '../utils/exportObservations';
import { db } from '@/services/storage/db';
import type { ExperimentObservation } from '@/services/storage/schemas';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = { active: 0, draft: 1, completed: 2 };

const SIGNIFICANCE_EMOJI: Record<string, string> = {
  high: '🟢',
  moderate: '🟡',
  low: '🔴',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600 bg-green-50',
  draft: 'text-yellow-600 bg-yellow-50',
  completed: 'text-gray-600 bg-gray-100',
};

// ─── Sorted experiments ───────────────────────────────────────────────────────

const SORTED_EXPERIMENTS: ExperimentDefinition[] = [...EXPERIMENTS].sort(
  (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricRow {
  metric: string;
  controlMean: number;
  treatmentMean: number;
  difference: number;
  significance: 'high' | 'moderate' | 'low';
  controlCount: number;
  treatmentCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVariantSplit(experiment: ExperimentDefinition): string {
  return experiment.variants
    .map(v => `${Math.round(v.weight * 100)}% ${v.name}`)
    .join(', ');
}

function formatDuration(startDate: string): string {
  const days = differenceInDays(new Date(), parseISO(startDate));
  return `Active for ${days} day${days === 1 ? '' : 's'}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExperimentDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [observationCounts, setObservationCounts] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState<ExperimentObservation[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load observation counts for all experiments on mount (parallel queries)
  useEffect(() => {
    async function loadCounts() {
      const results = await Promise.all(
        SORTED_EXPERIMENTS.map(exp =>
          db.experiment_observations.where('experimentId').equals(exp.id).toArray()
        )
      );
      const counts: Record<string, number> = {};
      SORTED_EXPERIMENTS.forEach((exp, i) => { counts[exp.id] = results[i].length; });
      setObservationCounts(counts);
    }
    loadCounts();
  }, []);

  // Load observations when an experiment is selected
  useEffect(() => {
    if (!selectedId) {
      setObservations([]);
      return;
    }
    let isCurrent = true;
    setLoadingDetails(true);
    db.experiment_observations
      .where('experimentId').equals(selectedId).toArray()
      .then(obs => {
        if (!isCurrent) return;
        setObservations(obs);
        setLoadingDetails(false);
      });
    return () => { isCurrent = false; };
  }, [selectedId]);

  // ── Detail view ────────────────────────────────────────────────────────────

  if (selectedId) {
    const experiment = EXPERIMENTS.find(e => e.id === selectedId)!;

    // Group observations by metric → by variant
    const byMetric: Record<string, { control: number[]; treatment: number[] }> = {};
    for (const obs of observations) {
      if (!byMetric[obs.metric]) byMetric[obs.metric] = { control: [], treatment: [] };
      if (obs.variantId === 'control') {
        byMetric[obs.metric].control.push(obs.value);
      } else {
        byMetric[obs.metric].treatment.push(obs.value);
      }
    }

    // Count total per variant
    const controlCount = observations.filter(o => o.variantId === 'control').length;
    const treatmentCount = observations.filter(o => o.variantId !== 'control').length;

    // Build table rows — skip metrics where either variant has no observations.
    // compareVariants(someData, []) would produce treatmentMean=0 and -100% percentChange,
    // yielding misleading 'high' significance when there's simply no treatment data yet.
    const incompleteMetrics = Object.keys(byMetric).filter(m =>
      byMetric[m].control.length === 0 || byMetric[m].treatment.length === 0
    );
    const tableRows: MetricRow[] = Object.entries(byMetric)
      .filter(([, { control, treatment }]) => control.length > 0 && treatment.length > 0)
      .map(([metric, { control, treatment }]) => {
        const comparison = compareVariants(control, treatment);
        return {
          metric,
          controlMean: comparison.controlMean,
          treatmentMean: comparison.treatmentMean,
          difference: comparison.difference,
          significance: comparison.significance,
          controlCount: control.length,
          treatmentCount: treatment.length,
        };
      });

    // Chart data
    const chartData = tableRows.map(row => ({
      metric: row.metric,
      Control: Number(row.controlMean.toFixed(3)),
      Treatment: Number(row.treatmentMean.toFixed(3)),
    }));

    const hasData = observations.length > 0;

    return (
      <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center"
            aria-label="Back to experiments list"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-semibold">{experiment.name}</h1>
            <p className="text-sm text-muted-foreground">{experiment.description}</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
          <span aria-label="experiment duration">{formatDuration(experiment.startDate)}</span>
          <span aria-label="sample size">
            {controlCount} control, {treatmentCount} treatment
          </span>
          <span>{observations.length} total observations</span>
        </div>

        {/* Loading state */}
        {loadingDetails && (
          <p className="text-muted-foreground">Loading observations...</p>
        )}

        {/* No data state */}
        {!loadingDetails && !hasData && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No data collected yet</p>
            <p className="text-sm mt-2">
              Enable Research Mode and complete training drills to collect observations.
            </p>
          </div>
        )}

        {/* Results */}
        {!loadingDetails && hasData && (
          <>
            {/* Metric comparison table */}
            <section aria-label="Metric comparison table" className="mb-8">
              <h2 className="text-base font-semibold mb-3">Metric Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Metric</th>
                      <th className="pb-2 pr-4 text-right">Control</th>
                      <th className="pb-2 pr-4 text-right">Treatment</th>
                      <th className="pb-2 pr-4 text-right">Difference</th>
                      <th className="pb-2 text-center">Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(row => (
                      <tr key={row.metric} className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">{row.metric}</td>
                        <td className="py-2 pr-4 text-right">{row.controlMean.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right">{row.treatmentMean.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right">
                          {row.difference >= 0 ? '+' : ''}{row.difference.toFixed(2)}
                        </td>
                        <td className="py-2 text-center" aria-label={`significance: ${row.significance}`}>
                          {SIGNIFICANCE_EMOJI[row.significance]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                🟢 High (&gt;10% or &gt;0.5 SD) · 🟡 Moderate (5–10%) · 🔴 Low (&lt;5%)
              </p>
              {incompleteMetrics.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1" aria-label="incomplete metrics notice">
                  {incompleteMetrics.length} metric{incompleteMetrics.length > 1 ? 's' : ''} omitted — needs data from both variants: {incompleteMetrics.join(', ')}
                </p>
              )}
            </section>

            {/* Bar chart */}
            <section aria-label="Metric bar chart" className="mb-8">
              <h2 className="text-base font-semibold mb-3">Visual Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} aria-label="Control vs Treatment comparison">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Control" fill="#6366f1" />
                  <Bar dataKey="Treatment" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Export */}
            <div className="pt-2">
              <button
                onClick={() => exportObservationsAsCSV(selectedId, observations)}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 min-h-[44px]"
                aria-label="Export observations as CSV"
              >
                Export as CSV
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Experiment Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">
        A/B experiment results — dev-only view
      </p>

      <div className="space-y-4">
        {SORTED_EXPERIMENTS.map(experiment => (
          <div
            key={experiment.id}
            className="border rounded-lg p-4 bg-card"
            data-testid={`experiment-card-${experiment.id}`}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="font-semibold">{experiment.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{experiment.description}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[experiment.status] ?? 'text-gray-500'}`}
                aria-label={`status: ${experiment.status}`}
              >
                {experiment.status}
              </span>
            </div>

            {/* Card details */}
            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              <p>{formatVariantSplit(experiment)}</p>
              <p aria-label={`observation count for ${experiment.id}`}>
                {observationCounts[experiment.id] ?? 0} observations
              </p>
            </div>

            {/* View Results button */}
            <button
              onClick={() => setSelectedId(experiment.id)}
              className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 min-h-[44px]"
              aria-label={`View results for ${experiment.name}`}
            >
              View Results
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
