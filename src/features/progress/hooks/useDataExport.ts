// useDataExport Hook - Story 5.5
// Manages data export: date range selection, data fetching, CSV/JSON generation
// Pattern: Same as useInsights/useConfidenceData

import { useState, useEffect, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import { toast } from 'sonner';
import { db } from '@/services/storage/db';
import { downloadExportedData, downloadCSVData } from '@/services/storage/exportData';
import { getUserSettings, getStreak } from '@/services/storage/localStorage';
import { generateFullCSV } from '../utils/csvFormatter';
import type { DateRange } from '../utils/csvFormatter';
import { DATE_RANGE_DAYS } from '../utils/csvFormatter';
import type { Session, DrillResult, Assessment } from '@/services/storage/schemas';
import type { UserSettings } from '@/services/storage/localStorage';

export interface ExportPayload {
  exportDate: string;
  dateRange: DateRange;
  sessions: Session[];
  drillResults: DrillResult[];
  assessments: Assessment[];
  userSettings: UserSettings;
  streak: number;
}

export interface UseDataExportResult {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  hasData: boolean;
  isLoading: boolean;
  isExporting: boolean;
  exportCSV: () => Promise<void>;
  exportJSON: () => Promise<void>;
}

/**
 * Hook to manage data export functionality
 * Checks data availability and triggers CSV/JSON downloads
 */
export function useDataExport(): UseDataExportResult {
  const [dateRange, setDateRange] = useState<DateRange>('all_time');
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Check if ANY data exists globally (AC-8: database-level check, not date-range-filtered)
  const checkDataAvailability = useCallback(async () => {
    try {
      const sessions = await db.sessions.toArray();
      setHasData(sessions.length > 0);
    } catch {
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkDataAvailability();
  }, [checkDataAvailability]);

  const exportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData(dateRange);

      if (!data) {
        toast('No sessions found in selected date range');
        return;
      }

      const csvContent = generateFullCSV(data.sessions, data.drillResults);
      const filename = `discalculas-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSVData(csvContent, filename);
      toast.success('Export complete! Check your downloads.');
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [dateRange]);

  const exportJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData(dateRange);

      if (!data) {
        toast('No sessions found in selected date range');
        return;
      }

      const assessments = await db.assessments.toArray();
      const userSettings = getUserSettings();
      const streak = getStreak();

      const payload: ExportPayload = {
        exportDate: new Date().toISOString(),
        dateRange,
        sessions: data.sessions,
        drillResults: data.drillResults,
        assessments,
        userSettings,
        streak,
      };

      const filename = `discalculas-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      downloadExportedData(payload, filename);
      toast.success('Export complete! Check your downloads.');
    } catch (err) {
      console.error('JSON export failed:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    hasData,
    isLoading,
    isExporting,
    exportCSV,
    exportJSON,
  };
}

// --- Internal helpers ---

async function fetchSessions(dateRange: DateRange): Promise<Session[]> {
  const days = DATE_RANGE_DAYS[dateRange];

  if (days === 0) {
    // All time
    return db.sessions.toArray();
  }

  const startDate = subDays(new Date(), days).toISOString();
  return db.sessions
    .where('timestamp')
    .aboveOrEqual(startDate)
    .toArray();
}

/**
 * Fetch sessions and their drill results for the given date range.
 * Returns null if no sessions found (caller should show toast).
 */
async function fetchExportData(
  dateRange: DateRange
): Promise<{ sessions: Session[]; drillResults: DrillResult[] } | null> {
  const sessions = await fetchSessions(dateRange);

  if (sessions.length === 0) return null;

  const sessionIds = sessions
    .map(s => s.id)
    .filter((id): id is number => id !== undefined);

  const drillResults = sessionIds.length > 0
    ? await db.drill_results.where('sessionId').anyOf(sessionIds).toArray()
    : [];

  return { sessions, drillResults };
}
