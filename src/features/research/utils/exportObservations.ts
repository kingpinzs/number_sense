// exportObservations.ts - CSV export utility for experiment observations
// Story 8.3: Build Experiment Results Dashboard
//
// Pure utility — no React. Triggers browser file download with observation data.

import type { ExperimentObservation } from '@/services/storage/schemas';

/**
 * Exports all observations for an experiment as a CSV file download.
 *
 * CSV columns: timestamp,userId,experimentId,variantId,metric,value
 * Filename format: experiment-{id}-{YYYY-MM-DD}.csv
 *
 * @param experimentId - Used in filename generation
 * @param observations - All observation records to export
 */
export function exportObservationsAsCSV(
  experimentId: string,
  observations: ExperimentObservation[]
): void {
  const header = 'timestamp,userId,experimentId,variantId,metric,value';
  const rows = observations.map(o =>
    [o.timestamp, o.userId, o.experimentId, o.variantId, o.metric, o.value].join(',')
  );
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `experiment-${experimentId}-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
