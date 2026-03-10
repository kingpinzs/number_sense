// Personal history storage service — Dexie CRUD with partial update
// Supports save-as-you-go with debounced auto-save

import { db } from '@/services/storage/db';
import type { PersonalHistory, HistorySectionData } from '../types';

/**
 * Get the latest personal history entry (or undefined if none)
 */
export async function getLatestPersonalHistory(): Promise<PersonalHistory | undefined> {
  return db.personal_history.orderBy('timestamp').reverse().first();
}

/**
 * Create a new personal history entry
 */
export async function createPersonalHistory(): Promise<number> {
  const entry: PersonalHistory = {
    timestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    completionStatus: 'in-progress',
    sections: {},
  };

  return db.personal_history.add(entry);
}

/**
 * Update a section's data in an existing personal history entry
 * Supports partial update — only the specified section is modified
 */
export async function updateHistorySection(
  historyId: number,
  sectionId: string,
  sectionData: HistorySectionData
): Promise<void> {
  const existing = await db.personal_history.get(historyId);
  if (!existing) return;

  const updatedSections = {
    ...existing.sections,
    [sectionId]: sectionData,
  };

  await db.personal_history.update(historyId, {
    sections: updatedSections,
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Mark a personal history entry as completed
 */
export async function completePersonalHistory(historyId: number): Promise<void> {
  await db.personal_history.update(historyId, {
    completionStatus: 'completed',
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Get all personal history entries
 */
export async function getAllPersonalHistories(): Promise<PersonalHistory[]> {
  return db.personal_history.orderBy('timestamp').reverse().toArray();
}
