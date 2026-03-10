// Tests for Symptom Definitions content
// Testing: SYMPTOM_DEFINITIONS, CATEGORY_LABELS, CATEGORY_ORDER, getSymptomsByCategory

import { describe, it, expect } from 'vitest';
import {
  SYMPTOM_DEFINITIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getSymptomsByCategory,
} from './symptomDefinitions';
import type { Domain, SymptomCategory } from '../types';

const ALL_DOMAINS: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];
const ALL_CATEGORIES: SymptomCategory[] = [
  'time_navigation',
  'numbers_arithmetic',
  'memory_processing',
  'spatial_motor',
  'emotional_practical',
];

describe('SYMPTOM_DEFINITIONS', () => {
  it('has exactly 22 symptoms', () => {
    expect(SYMPTOM_DEFINITIONS).toHaveLength(22);
  });

  it('has unique ids for all symptoms', () => {
    const ids = SYMPTOM_DEFINITIONS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(22);
  });

  it('every symptom has a non-empty id', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      expect(symptom.id).toBeTruthy();
      expect(symptom.id.length).toBeGreaterThan(0);
    }
  });

  it('every symptom has a non-empty label', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      expect(symptom.label).toBeTruthy();
      expect(symptom.label.length).toBeGreaterThan(0);
    }
  });

  it('every symptom has a valid category', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      expect(ALL_CATEGORIES).toContain(symptom.category);
    }
  });

  it('every symptom has at least one domain', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      expect(symptom.domains.length).toBeGreaterThan(0);
    }
  });

  it('every symptom domain is a valid Domain', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      for (const domain of symptom.domains) {
        expect(ALL_DOMAINS).toContain(domain);
      }
    }
  });

  it('no symptom has more than 6 domains', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      expect(symptom.domains.length).toBeLessThanOrEqual(6);
    }
  });

  it('has 4 symptoms in time_navigation category', () => {
    const count = SYMPTOM_DEFINITIONS.filter(s => s.category === 'time_navigation').length;
    expect(count).toBe(4);
  });

  it('has 7 symptoms in numbers_arithmetic category', () => {
    const count = SYMPTOM_DEFINITIONS.filter(s => s.category === 'numbers_arithmetic').length;
    expect(count).toBe(7);
  });

  it('has 6 symptoms in memory_processing category', () => {
    const count = SYMPTOM_DEFINITIONS.filter(s => s.category === 'memory_processing').length;
    expect(count).toBe(6);
  });

  it('has 3 symptoms in spatial_motor category', () => {
    const count = SYMPTOM_DEFINITIONS.filter(s => s.category === 'spatial_motor').length;
    expect(count).toBe(3);
  });

  it('has 2 symptoms in emotional_practical category', () => {
    const count = SYMPTOM_DEFINITIONS.filter(s => s.category === 'emotional_practical').length;
    expect(count).toBe(2);
  });

  it('category counts sum to 22', () => {
    const total = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + SYMPTOM_DEFINITIONS.filter(s => s.category === cat).length,
      0
    );
    expect(total).toBe(22);
  });

  it('all 6 domains are used by at least one symptom', () => {
    for (const domain of ALL_DOMAINS) {
      const symptomsForDomain = SYMPTOM_DEFINITIONS.filter(s => s.domains.includes(domain));
      expect(symptomsForDomain.length).toBeGreaterThan(0);
    }
  });

  it('math_anxiety maps to all 6 domains', () => {
    const mathAnxiety = SYMPTOM_DEFINITIONS.find(s => s.id === 'math_anxiety');
    expect(mathAnxiety).toBeDefined();
    expect(mathAnxiety!.domains).toHaveLength(6);
    for (const domain of ALL_DOMAINS) {
      expect(mathAnxiety!.domains).toContain(domain);
    }
  });

  it('no symptom has duplicate domains', () => {
    for (const symptom of SYMPTOM_DEFINITIONS) {
      const uniqueDomains = new Set(symptom.domains);
      expect(uniqueDomains.size).toBe(symptom.domains.length);
    }
  });
});

describe('CATEGORY_LABELS', () => {
  it('has labels for all 5 categories', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(5);
  });

  it('every category has a non-empty label', () => {
    for (const category of ALL_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
      expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
    }
  });

  it('has expected display labels', () => {
    expect(CATEGORY_LABELS.time_navigation).toBe('Time & Navigation');
    expect(CATEGORY_LABELS.numbers_arithmetic).toBe('Numbers & Arithmetic');
    expect(CATEGORY_LABELS.memory_processing).toBe('Memory & Processing');
    expect(CATEGORY_LABELS.spatial_motor).toBe('Spatial & Motor');
    expect(CATEGORY_LABELS.emotional_practical).toBe('Emotional & Practical');
  });
});

describe('CATEGORY_ORDER', () => {
  it('has exactly 5 categories', () => {
    expect(CATEGORY_ORDER).toHaveLength(5);
  });

  it('contains all valid categories', () => {
    for (const category of ALL_CATEGORIES) {
      expect(CATEGORY_ORDER).toContain(category);
    }
  });

  it('has no duplicate categories', () => {
    const unique = new Set(CATEGORY_ORDER);
    expect(unique.size).toBe(5);
  });

  it('starts with time_navigation and ends with emotional_practical', () => {
    expect(CATEGORY_ORDER[0]).toBe('time_navigation');
    expect(CATEGORY_ORDER[4]).toBe('emotional_practical');
  });
});

describe('getSymptomsByCategory', () => {
  it('returns a Map with 5 entries', () => {
    const grouped = getSymptomsByCategory();
    expect(grouped.size).toBe(5);
  });

  it('groups symptoms correctly by category', () => {
    const grouped = getSymptomsByCategory();

    for (const [category, symptoms] of grouped) {
      for (const symptom of symptoms) {
        expect(symptom.category).toBe(category);
      }
    }
  });

  it('total grouped symptoms equals 22', () => {
    const grouped = getSymptomsByCategory();
    let total = 0;
    for (const symptoms of grouped.values()) {
      total += symptoms.length;
    }
    expect(total).toBe(22);
  });

  it('preserves CATEGORY_ORDER as Map iteration order', () => {
    const grouped = getSymptomsByCategory();
    const keys = Array.from(grouped.keys());
    expect(keys).toEqual(CATEGORY_ORDER);
  });

  it('returns correct counts per category', () => {
    const grouped = getSymptomsByCategory();
    expect(grouped.get('time_navigation')).toHaveLength(4);
    expect(grouped.get('numbers_arithmetic')).toHaveLength(7);
    expect(grouped.get('memory_processing')).toHaveLength(6);
    expect(grouped.get('spatial_motor')).toHaveLength(3);
    expect(grouped.get('emotional_practical')).toHaveLength(2);
  });

  it('returns non-empty arrays for all categories', () => {
    const grouped = getSymptomsByCategory();
    for (const symptoms of grouped.values()) {
      expect(symptoms.length).toBeGreaterThan(0);
    }
  });
});
