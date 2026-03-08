// DataExport Component - Story 5.5
// Displays data export section with date range selector and CSV/JSON export buttons
// Architecture: Presentational component consuming useDataExport hook

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useDataExport } from '../hooks/useDataExport';
import { DATE_RANGE_OPTIONS } from '../utils/csvFormatter';
import type { DateRange } from '../utils/csvFormatter';

export default function DataExport() {
  const {
    dateRange,
    setDateRange,
    hasData,
    isLoading,
    isExporting,
    exportCSV,
    exportJSON,
  } = useDataExport();

  return (
    <Card className="mb-6" data-testid="data-export">
      <CardHeader>
        <CardTitle className="text-lg">Export Your Data</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Privacy notice (AC-7) */}
        <p className="text-sm text-muted-foreground mb-4">
          Your data stays on your device. Exports are created locally.
        </p>

        {/* Date range selector (AC-2) */}
        <div className="mb-4">
          <label htmlFor="export-date-range" className="sr-only">
            Date range
          </label>
          <select
            id="export-date-range"
            role="combobox"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Empty state (AC-8) — only show after initial check completes */}
        {!isLoading && !hasData && (
          <p
            data-testid="export-empty"
            className="text-muted-foreground text-center py-4"
          >
            No data to export yet
          </p>
        )}

        {/* Export buttons (AC-1) */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            disabled={!hasData || isExporting}
            onClick={exportCSV}
          >
            Export as CSV
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            disabled={!hasData || isExporting}
            onClick={exportJSON}
          >
            Export as JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
