// Tests for Symptom Storage Service
// Testing: calculateDomainImpact, saveSymptomChecklist, getLatestSymptomChecklist, getAllSymptomChecklists

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { DiscalculasDB } from '@/services/storage/db';
import { calculateDomainImpact, saveSymptomChecklist, getLatestSymptomChecklist, getAllSymptomChecklists } from './symptomStorage';
import { SYMPTOM_DEFINITIONS } from '../content/symptomDefinitions';
import type { SymptomResponse, Domain } from '../types';

// Suppress Dexie "Another connection wants to delete database" and slow query warnings
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('Another connection wants to delete database') || msg.includes('Slow query:')) return;
    originalWarn(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});

describe('calculateDomainImpact', () => {
  const ALL_DOMAINS: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];

  it('returns all zeros when no symptoms are provided', () => {
    const impact = calculateDomainImpact([]);

    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBe(0);
    }
  });

  it('returns all zeros when no symptoms are checked', () => {
    const symptoms: SymptomResponse[] = SYMPTOM_DEFINITIONS.map(def => ({
      symptomId: def.id,
      checked: false,
    }));

    const impact = calculateDomainImpact(symptoms);

    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBe(0);
    }
  });

  it('returns normalized scores when all symptoms are checked with max severity', () => {
    const symptoms: SymptomResponse[] = SYMPTOM_DEFINITIONS.map(def => ({
      symptomId: def.id,
      checked: true,
      severity: 3,
    }));

    const impact = calculateDomainImpact(symptoms);

    // All checked with severity 3 — every domain should be 1.0 (max / max)
    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBe(1);
    }
  });

  it('returns normalized scores when all symptoms are checked with default severity', () => {
    const symptoms: SymptomResponse[] = SYMPTOM_DEFINITIONS.map(def => ({
      symptomId: def.id,
      checked: true,
      // No severity → defaults to 1
    }));

    const impact = calculateDomainImpact(symptoms);

    // All checked with severity 1, max is 3 per symptom
    // Each domain: sum(1 per symptom) / sum(3 per symptom) = 1/3
    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBeCloseTo(1 / 3, 5);
    }
  });

  it('returns correct partial impact for a single checked symptom', () => {
    // 'number_reversals' maps to domains: ['numberSense', 'placeValue']
    const symptoms: SymptomResponse[] = SYMPTOM_DEFINITIONS.map(def => ({
      symptomId: def.id,
      checked: def.id === 'number_reversals',
      severity: def.id === 'number_reversals' ? 2 : undefined,
    }));

    const impact = calculateDomainImpact(symptoms);

    // numberSense: has multiple symptoms mapping to it; only 'number_reversals' checked with severity 2
    // The max for numberSense = 3 * (number of symptoms mapping to numberSense)
    // The raw for numberSense = 2 (only 'number_reversals' contributes)
    const numberSenseSymptoms = SYMPTOM_DEFINITIONS.filter(d => d.domains.includes('numberSense'));
    expect(impact.numberSense).toBeCloseTo(2 / (numberSenseSymptoms.length * 3), 5);

    const placeValueSymptoms = SYMPTOM_DEFINITIONS.filter(d => d.domains.includes('placeValue'));
    expect(impact.placeValue).toBeCloseTo(2 / (placeValueSymptoms.length * 3), 5);

    // Domains not in 'number_reversals' — should be 0
    expect(impact.arithmetic).toBe(0);
  });

  it('handles mixed severities across checked symptoms', () => {
    // Check 3 symptoms with different severities
    const symptoms: SymptomResponse[] = [
      { symptomId: 'time_management', checked: true, severity: 1 },  // domains: applied, sequencing
      { symptomId: 'inconsistent_arithmetic', checked: true, severity: 3 },  // domains: arithmetic
      { symptomId: 'number_reversals', checked: false, severity: 2 },  // not checked — should not count
    ];

    const impact = calculateDomainImpact(symptoms);

    // applied: max = 3 (time_management), raw = 1 → 1/3
    expect(impact.applied).toBeCloseTo(1 / 3, 5);
    // sequencing: max = 3, raw = 1 → 1/3
    expect(impact.sequencing).toBeCloseTo(1 / 3, 5);
    // arithmetic: max = 3, raw = 3 → 1.0
    expect(impact.arithmetic).toBeCloseTo(1, 5);
    // numberSense: max = 3 (from number_reversals), raw = 0 (not checked) → 0
    expect(impact.numberSense).toBe(0);
    // placeValue: max = 3, raw = 0 → 0
    expect(impact.placeValue).toBe(0);
    // spatial: no symptoms mapping here → 0
    expect(impact.spatial).toBe(0);
  });

  it('ignores symptoms with unknown ids', () => {
    const symptoms: SymptomResponse[] = [
      { symptomId: 'nonexistent_symptom', checked: true, severity: 3 },
    ];

    const impact = calculateDomainImpact(symptoms);

    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBe(0);
    }
  });

  it('uses severity 1 as default when checked but no severity provided', () => {
    const symptoms: SymptomResponse[] = [
      { symptomId: 'inconsistent_arithmetic', checked: true },  // domains: arithmetic
    ];

    const impact = calculateDomainImpact(symptoms);

    // arithmetic: max = 3, raw = 1 (default severity) → 1/3
    expect(impact.arithmetic).toBeCloseTo(1 / 3, 5);
  });

  it('handles the math_anxiety symptom which maps to all 6 domains', () => {
    const symptoms: SymptomResponse[] = [
      { symptomId: 'math_anxiety', checked: true, severity: 2 },
    ];

    const impact = calculateDomainImpact(symptoms);

    // math_anxiety maps to all 6 domains, so each gets impact = 2/3
    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBeCloseTo(2 / 3, 5);
    }
  });

  it('returns values strictly between 0 and 1 inclusive', () => {
    const symptoms: SymptomResponse[] = SYMPTOM_DEFINITIONS.map(def => ({
      symptomId: def.id,
      checked: Math.random() > 0.5,
      severity: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
    }));

    const impact = calculateDomainImpact(symptoms);

    for (const domain of ALL_DOMAINS) {
      expect(impact[domain]).toBeGreaterThanOrEqual(0);
      expect(impact[domain]).toBeLessThanOrEqual(1);
    }
  });
});

describe('Symptom Checklist Dexie CRUD', () => {
  let testDB: DiscalculasDB;

  beforeEach(() => {
    testDB = new DiscalculasDB();
  });

  afterEach(async () => {
    await testDB.delete();
    await testDB.close();
  });

  describe('saveSymptomChecklist', () => {
    it('saves a checklist and returns an id', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'time_management', checked: true, severity: 2 },
        { symptomId: 'analog_time', checked: false },
      ];

      const id = await saveSymptomChecklist(symptoms);

      expect(id).toBeGreaterThan(0);
    });

    it('saves computed domainImpact alongside symptoms', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'inconsistent_arithmetic', checked: true, severity: 3 },
      ];

      const id = await saveSymptomChecklist(symptoms);
      const entry = await testDB.symptom_checklists.get(id);

      expect(entry).toBeDefined();
      expect(entry!.domainImpact).toBeDefined();
      expect(entry!.domainImpact.arithmetic).toBeCloseTo(1, 5);
    });

    it('saves optional notes', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'time_management', checked: true, severity: 1 },
      ];

      const id = await saveSymptomChecklist(symptoms, 'My personal notes');
      const entry = await testDB.symptom_checklists.get(id);

      expect(entry!.notes).toBe('My personal notes');
    });

    it('saves without notes when omitted', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'time_management', checked: true, severity: 1 },
      ];

      const id = await saveSymptomChecklist(symptoms);
      const entry = await testDB.symptom_checklists.get(id);

      expect(entry!.notes).toBeUndefined();
    });

    it('saves a valid ISO timestamp', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'time_management', checked: true, severity: 1 },
      ];

      const id = await saveSymptomChecklist(symptoms);
      const entry = await testDB.symptom_checklists.get(id);

      // Verify it's a valid ISO string
      const parsed = new Date(entry!.timestamp);
      expect(parsed.toISOString()).toBe(entry!.timestamp);
    });

    it('saves the full symptoms array', async () => {
      const symptoms: SymptomResponse[] = [
        { symptomId: 'time_management', checked: true, severity: 2 },
        { symptomId: 'analog_time', checked: false },
        { symptomId: 'directional_confusion', checked: true, severity: 1 },
      ];

      const id = await saveSymptomChecklist(symptoms);
      const entry = await testDB.symptom_checklists.get(id);

      expect(entry!.symptoms).toHaveLength(3);
      expect(entry!.symptoms[0].symptomId).toBe('time_management');
      expect(entry!.symptoms[0].checked).toBe(true);
      expect(entry!.symptoms[0].severity).toBe(2);
      expect(entry!.symptoms[1].checked).toBe(false);
    });
  });

  describe('getLatestSymptomChecklist', () => {
    it('returns undefined when no checklists exist', async () => {
      const latest = await getLatestSymptomChecklist();
      expect(latest).toBeUndefined();
    });

    it('returns the most recent checklist by timestamp', async () => {
      // Save two entries — the second one should be "latest"
      await saveSymptomChecklist([
        { symptomId: 'time_management', checked: true, severity: 1 },
      ], 'first entry');

      // Small delay to ensure distinct timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await saveSymptomChecklist([
        { symptomId: 'analog_time', checked: true, severity: 3 },
      ], 'second entry');

      const latest = await getLatestSymptomChecklist();

      expect(latest).toBeDefined();
      expect(latest!.notes).toBe('second entry');
    });
  });

  describe('getAllSymptomChecklists', () => {
    it('returns empty array when no checklists exist', async () => {
      const all = await getAllSymptomChecklists();
      expect(all).toEqual([]);
    });

    it('returns all checklists in reverse chronological order', async () => {
      await saveSymptomChecklist([
        { symptomId: 'time_management', checked: true, severity: 1 },
      ], 'first');

      await new Promise(resolve => setTimeout(resolve, 10));

      await saveSymptomChecklist([
        { symptomId: 'analog_time', checked: true, severity: 2 },
      ], 'second');

      await new Promise(resolve => setTimeout(resolve, 10));

      await saveSymptomChecklist([
        { symptomId: 'directional_confusion', checked: true, severity: 3 },
      ], 'third');

      const all = await getAllSymptomChecklists();

      expect(all).toHaveLength(3);
      // Reverse chronological — most recent first
      expect(all[0].notes).toBe('third');
      expect(all[1].notes).toBe('second');
      expect(all[2].notes).toBe('first');
    });
  });
});
