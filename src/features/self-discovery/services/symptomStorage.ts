// Symptom checklist storage service — Dexie CRUD
// Saves and retrieves symptom checklist entries

import { db } from '@/services/storage/db';
import type { SymptomChecklistEntry, SymptomResponse, Domain } from '../types';
import { SYMPTOM_DEFINITIONS } from '../content/symptomDefinitions';

/**
 * Calculate domain impact scores from symptom responses
 * Each domain gets a 0-1 normalized score based on checked symptoms + severity
 */
export function calculateDomainImpact(symptoms: SymptomResponse[]): Record<Domain, number> {
  const domains: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];
  const rawScores: Record<Domain, number> = {
    numberSense: 0, placeValue: 0, sequencing: 0,
    arithmetic: 0, spatial: 0, applied: 0,
  };
  const maxScores: Record<Domain, number> = {
    numberSense: 0, placeValue: 0, sequencing: 0,
    arithmetic: 0, spatial: 0, applied: 0,
  };

  for (const symptom of symptoms) {
    const definition = SYMPTOM_DEFINITIONS.find(d => d.id === symptom.symptomId);
    if (!definition) continue;

    for (const domain of definition.domains) {
      // Each symptom can contribute up to 3 points (severity) per domain
      maxScores[domain] += 3;
      if (symptom.checked) {
        rawScores[domain] += symptom.severity ?? 1;
      }
    }
  }

  // Normalize to 0-1
  const impact: Record<Domain, number> = { ...rawScores };
  for (const domain of domains) {
    impact[domain] = maxScores[domain] > 0 ? rawScores[domain] / maxScores[domain] : 0;
  }

  return impact;
}

/**
 * Save a symptom checklist entry to Dexie
 */
export async function saveSymptomChecklist(
  symptoms: SymptomResponse[],
  notes?: string
): Promise<number> {
  const domainImpact = calculateDomainImpact(symptoms);

  const entry: SymptomChecklistEntry = {
    timestamp: new Date().toISOString(),
    symptoms,
    domainImpact,
    notes,
  };

  return db.symptom_checklists.add(entry);
}

/**
 * Get the latest symptom checklist entry
 */
export async function getLatestSymptomChecklist(): Promise<SymptomChecklistEntry | undefined> {
  return db.symptom_checklists.orderBy('timestamp').reverse().first();
}

/**
 * Get all symptom checklist entries
 */
export async function getAllSymptomChecklists(): Promise<SymptomChecklistEntry[]> {
  return db.symptom_checklists.orderBy('timestamp').reverse().toArray();
}
