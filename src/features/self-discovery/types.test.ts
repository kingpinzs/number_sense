// Tests for Self-Discovery types
// Testing: Interface structure, required/optional fields, type safety
// Pattern follows schemas.test.ts — create instances and validate structure

import { describe, it, expect } from 'vitest';
import type {
  Domain,
  SymptomSeverity,
  SymptomResponse,
  SymptomChecklistEntry,
  HistoryCompletionStatus,
  HistorySectionData,
  PersonalHistory,
  SymptomCategory,
  SymptomDefinition,
  IntakeFieldType,
  IntakeField,
  IntakeSection,
  ColoredDotsDifficulty,
  DotSize,
  SizeMode,
  ColoredDot,
  ColorSizeStats,
  ColoredDotsRoundResult,
} from './types';

describe('Domain type', () => {
  it('accepts all 6 valid domain values', () => {
    const domains: Domain[] = [
      'numberSense', 'placeValue', 'sequencing',
      'arithmetic', 'spatial', 'applied',
    ];
    expect(domains).toHaveLength(6);
    domains.forEach(d => expect(typeof d).toBe('string'));
  });
});

describe('SymptomSeverity type', () => {
  it('accepts valid severity values 1, 2, 3', () => {
    const severities: SymptomSeverity[] = [1, 2, 3];
    expect(severities).toHaveLength(3);
    severities.forEach(s => {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(3);
    });
  });
});

describe('SymptomResponse interface', () => {
  it('accepts a checked response with severity', () => {
    const response: SymptomResponse = {
      symptomId: 'time_management',
      checked: true,
      severity: 2,
    };

    expect(response.symptomId).toBe('time_management');
    expect(response.checked).toBe(true);
    expect(response.severity).toBe(2);
  });

  it('accepts an unchecked response without severity', () => {
    const response: SymptomResponse = {
      symptomId: 'analog_time',
      checked: false,
    };

    expect(response.symptomId).toBe('analog_time');
    expect(response.checked).toBe(false);
    expect(response.severity).toBeUndefined();
  });

  it('accepts all severity levels', () => {
    const severities: SymptomSeverity[] = [1, 2, 3];
    severities.forEach(severity => {
      const response: SymptomResponse = {
        symptomId: 'test',
        checked: true,
        severity,
      };
      expect(response.severity).toBe(severity);
    });
  });
});

describe('SymptomChecklistEntry interface', () => {
  it('accepts a full checklist entry with optional id and notes', () => {
    const entry: SymptomChecklistEntry = {
      id: 1,
      timestamp: '2026-03-10T10:00:00.000Z',
      symptoms: [
        { symptomId: 'time_management', checked: true, severity: 2 },
        { symptomId: 'analog_time', checked: false },
      ],
      domainImpact: {
        numberSense: 0.5,
        placeValue: 0.2,
        sequencing: 0.3,
        arithmetic: 0.1,
        spatial: 0.8,
        applied: 0.4,
      },
      notes: 'Some notes',
    };

    expect(entry.id).toBe(1);
    expect(entry.timestamp).toBe('2026-03-10T10:00:00.000Z');
    expect(entry.symptoms).toHaveLength(2);
    expect(entry.domainImpact.numberSense).toBe(0.5);
    expect(entry.notes).toBe('Some notes');
  });

  it('accepts entry without optional id and notes', () => {
    const entry: SymptomChecklistEntry = {
      timestamp: '2026-03-10T10:00:00.000Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0, placeValue: 0, sequencing: 0,
        arithmetic: 0, spatial: 0, applied: 0,
      },
    };

    expect(entry.id).toBeUndefined();
    expect(entry.notes).toBeUndefined();
    expect(entry.symptoms).toHaveLength(0);
  });

  it('domainImpact has all 6 domain keys', () => {
    const entry: SymptomChecklistEntry = {
      timestamp: '2026-03-10T10:00:00.000Z',
      symptoms: [],
      domainImpact: {
        numberSense: 0, placeValue: 0, sequencing: 0,
        arithmetic: 0, spatial: 0, applied: 0,
      },
    };

    const domains: Domain[] = ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'];
    for (const domain of domains) {
      expect(domain in entry.domainImpact).toBe(true);
    }
  });
});

describe('HistoryCompletionStatus type', () => {
  it('accepts valid completion statuses', () => {
    const statuses: HistoryCompletionStatus[] = ['in-progress', 'completed'];
    expect(statuses).toHaveLength(2);
    expect(statuses).toContain('in-progress');
    expect(statuses).toContain('completed');
  });
});

describe('HistorySectionData interface', () => {
  it('accepts completed section with data', () => {
    const section: HistorySectionData = {
      completed: true,
      data: { medications: 'aspirin', conditions: 'none' },
    };

    expect(section.completed).toBe(true);
    expect(section.data.medications).toBe('aspirin');
    expect(section.data.conditions).toBe('none');
  });

  it('accepts incomplete section with empty data', () => {
    const section: HistorySectionData = {
      completed: false,
      data: {},
    };

    expect(section.completed).toBe(false);
    expect(Object.keys(section.data)).toHaveLength(0);
  });

  it('accepts arbitrary string key-value pairs in data', () => {
    const section: HistorySectionData = {
      completed: true,
      data: {
        key1: 'value1',
        key2: 'value2',
        key3: '',
      },
    };

    expect(Object.keys(section.data)).toHaveLength(3);
    expect(section.data.key3).toBe('');
  });
});

describe('PersonalHistory interface', () => {
  it('accepts full personal history with optional id', () => {
    const history: PersonalHistory = {
      id: 1,
      timestamp: '2026-03-10T10:00:00.000Z',
      lastUpdated: '2026-03-10T11:00:00.000Z',
      completionStatus: 'in-progress',
      sections: {
        medications: {
          completed: true,
          data: { medications: 'aspirin' },
        },
      },
    };

    expect(history.id).toBe(1);
    expect(history.timestamp).toBe('2026-03-10T10:00:00.000Z');
    expect(history.lastUpdated).toBe('2026-03-10T11:00:00.000Z');
    expect(history.completionStatus).toBe('in-progress');
    expect(history.sections.medications.completed).toBe(true);
  });

  it('accepts entry without optional id', () => {
    const history: PersonalHistory = {
      timestamp: '2026-03-10T10:00:00.000Z',
      lastUpdated: '2026-03-10T10:00:00.000Z',
      completionStatus: 'completed',
      sections: {},
    };

    expect(history.id).toBeUndefined();
    expect(history.completionStatus).toBe('completed');
  });

  it('accepts all completion status values', () => {
    const statuses: HistoryCompletionStatus[] = ['in-progress', 'completed'];
    statuses.forEach(status => {
      const history: PersonalHistory = {
        timestamp: '2026-03-10T10:00:00.000Z',
        lastUpdated: '2026-03-10T10:00:00.000Z',
        completionStatus: status,
        sections: {},
      };
      expect(history.completionStatus).toBe(status);
    });
  });

  it('accepts multiple sections', () => {
    const history: PersonalHistory = {
      timestamp: '2026-03-10T10:00:00.000Z',
      lastUpdated: '2026-03-10T10:00:00.000Z',
      completionStatus: 'in-progress',
      sections: {
        medications: { completed: true, data: { medications: 'aspirin' } },
        sensory: { completed: false, data: { vision: 'glasses' } },
        early_childhood: { completed: true, data: { birth_complications: 'none' } },
      },
    };

    expect(Object.keys(history.sections)).toHaveLength(3);
  });
});

describe('SymptomCategory type', () => {
  it('accepts all 5 valid category values', () => {
    const categories: SymptomCategory[] = [
      'time_navigation',
      'numbers_arithmetic',
      'memory_processing',
      'spatial_motor',
      'emotional_practical',
    ];
    expect(categories).toHaveLength(5);
    categories.forEach(c => expect(typeof c).toBe('string'));
  });
});

describe('SymptomDefinition interface', () => {
  it('accepts a valid symptom definition', () => {
    const definition: SymptomDefinition = {
      id: 'time_management',
      label: 'Difficulty with time management',
      category: 'time_navigation',
      domains: ['applied', 'sequencing'],
    };

    expect(definition.id).toBe('time_management');
    expect(definition.label).toBeTruthy();
    expect(definition.category).toBe('time_navigation');
    expect(definition.domains).toHaveLength(2);
  });

  it('accepts definition with single domain', () => {
    const definition: SymptomDefinition = {
      id: 'directional_confusion',
      label: 'Confusion with directions',
      category: 'time_navigation',
      domains: ['spatial'],
    };

    expect(definition.domains).toHaveLength(1);
  });

  it('accepts definition with all 6 domains', () => {
    const definition: SymptomDefinition = {
      id: 'math_anxiety',
      label: 'Significant math anxiety',
      category: 'emotional_practical',
      domains: ['numberSense', 'placeValue', 'sequencing', 'arithmetic', 'spatial', 'applied'],
    };

    expect(definition.domains).toHaveLength(6);
  });
});

describe('IntakeFieldType type', () => {
  it('accepts all valid field types', () => {
    const types: IntakeFieldType[] = ['textarea', 'checkbox', 'text'];
    expect(types).toHaveLength(3);
    types.forEach(t => expect(typeof t).toBe('string'));
  });
});

describe('IntakeField interface', () => {
  it('accepts field with all properties including placeholder', () => {
    const field: IntakeField = {
      key: 'medications',
      label: 'Current medications',
      type: 'textarea',
      placeholder: 'List your medications...',
    };

    expect(field.key).toBe('medications');
    expect(field.label).toBeTruthy();
    expect(field.type).toBe('textarea');
    expect(field.placeholder).toBeTruthy();
  });

  it('accepts field without optional placeholder', () => {
    const field: IntakeField = {
      key: 'some_field',
      label: 'Some label',
      type: 'checkbox',
    };

    expect(field.placeholder).toBeUndefined();
  });

  it('accepts all field types', () => {
    const types: IntakeFieldType[] = ['textarea', 'checkbox', 'text'];
    types.forEach(type => {
      const field: IntakeField = {
        key: 'test',
        label: 'Test',
        type,
      };
      expect(field.type).toBe(type);
    });
  });
});

describe('IntakeSection interface', () => {
  it('accepts a valid intake section', () => {
    const section: IntakeSection = {
      id: 'medications',
      title: 'Current Medications',
      description: 'List your current medications',
      fields: [
        { key: 'medications', label: 'Medications', type: 'textarea', placeholder: 'List...' },
        { key: 'conditions', label: 'Conditions', type: 'textarea' },
      ],
    };

    expect(section.id).toBe('medications');
    expect(section.title).toBeTruthy();
    expect(section.description).toBeTruthy();
    expect(section.fields).toHaveLength(2);
  });
});

describe('ColoredDotsDifficulty interface', () => {
  it('accepts a valid difficulty configuration', () => {
    const difficulty: ColoredDotsDifficulty = {
      label: 'Easy',
      colorCount: 3,
      minDots: 3,
      maxDots: 7,
      displayTimeMs: 2000,
    };

    expect(difficulty.label).toBe('Easy');
    expect(difficulty.colorCount).toBe(3);
    expect(difficulty.minDots).toBe(3);
    expect(difficulty.maxDots).toBe(7);
    expect(difficulty.displayTimeMs).toBe(2000);
  });

  it('accepts colorCount of 2, 3, or 4', () => {
    const easy: ColoredDotsDifficulty = {
      label: 'Easy', colorCount: 2, minDots: 3, maxDots: 7, displayTimeMs: 3000,
    };
    const medium: ColoredDotsDifficulty = {
      label: 'Medium', colorCount: 3, minDots: 7, maxDots: 12, displayTimeMs: 2000,
    };
    const hard: ColoredDotsDifficulty = {
      label: 'Hard', colorCount: 4, minDots: 12, maxDots: 20, displayTimeMs: 1000,
    };

    expect(easy.colorCount).toBe(2);
    expect(medium.colorCount).toBe(3);
    expect(hard.colorCount).toBe(4);
  });
});

describe('DotSize type', () => {
  it('accepts all 3 valid size values', () => {
    const sizes: DotSize[] = ['small', 'normal', 'large'];
    expect(sizes).toHaveLength(3);
    sizes.forEach(s => expect(typeof s).toBe('string'));
  });
});

describe('SizeMode type', () => {
  it('accepts all 3 valid mode values', () => {
    const modes: SizeMode[] = ['uniform', 'varied', 'biased'];
    expect(modes).toHaveLength(3);
    modes.forEach(m => expect(typeof m).toBe('string'));
  });
});

describe('ColoredDot interface', () => {
  it('accepts a valid dot with all required fields', () => {
    const dot: ColoredDot = {
      x: 150,
      y: 200,
      color: '#ff0000',
      colorName: 'red',
      radius: 8,
      size: 'normal',
    };

    expect(dot.x).toBe(150);
    expect(dot.y).toBe(200);
    expect(dot.color).toBe('#ff0000');
    expect(dot.colorName).toBe('red');
    expect(dot.radius).toBe(8);
    expect(dot.size).toBe('normal');
  });

  it('accepts all dot size values', () => {
    const sizes: DotSize[] = ['small', 'normal', 'large'];
    const radii = [5, 8, 12];
    sizes.forEach((size, i) => {
      const dot: ColoredDot = {
        x: 0, y: 0, color: '#000', colorName: 'test',
        radius: radii[i], size,
      };
      expect(dot.size).toBe(size);
      expect(dot.radius).toBe(radii[i]);
    });
  });

  it('accepts zero coordinates', () => {
    const dot: ColoredDot = {
      x: 0,
      y: 0,
      color: '#000000',
      colorName: 'black',
      radius: 8,
      size: 'normal',
    };

    expect(dot.x).toBe(0);
    expect(dot.y).toBe(0);
  });
});

describe('ColorSizeStats interface', () => {
  it('accepts valid size statistics', () => {
    const stats: ColorSizeStats = {
      total: 10,
      small: 3,
      normal: 4,
      large: 3,
    };

    expect(stats.total).toBe(10);
    expect(stats.small + stats.normal + stats.large).toBe(10);
  });

  it('accepts all-zero stats', () => {
    const stats: ColorSizeStats = {
      total: 0,
      small: 0,
      normal: 0,
      large: 0,
    };

    expect(stats.total).toBe(0);
  });

  it('accepts stats with only one size category', () => {
    const stats: ColorSizeStats = {
      total: 5,
      small: 0,
      normal: 5,
      large: 0,
    };

    expect(stats.normal).toBe(5);
    expect(stats.small).toBe(0);
    expect(stats.large).toBe(0);
  });
});

describe('ColoredDotsRoundResult interface', () => {
  it('accepts a complete round result with all size fields', () => {
    const result: ColoredDotsRoundResult = {
      correctColor: 'red',
      phase1Answer: 'red',
      phase2Answer: 'blue',
      phase1Correct: true,
      phase2Correct: false,
      phase1ResponseTimeMs: 1500,
      phase2ResponseTimeMs: 2000,
      dotCounts: { red: 3, blue: 2, green: 4 },
      sizeStats: {
        red: { total: 3, small: 1, normal: 1, large: 1 },
        blue: { total: 2, small: 0, normal: 1, large: 1 },
        green: { total: 4, small: 1, normal: 2, large: 1 },
      },
      sizeMode: 'varied',
      largestDotColor: 'blue',
      pickedLargestDotColor: false,
      difficulty: 'easy',
    };

    expect(result.correctColor).toBe('red');
    expect(result.phase1Answer).toBe('red');
    expect(result.phase1Correct).toBe(true);
    expect(result.phase2Correct).toBe(false);
    expect(result.dotCounts.red).toBe(3);
    expect(result.sizeMode).toBe('varied');
    expect(result.largestDotColor).toBe('blue');
    expect(result.pickedLargestDotColor).toBe(false);
    expect(result.difficulty).toBe('easy');
  });

  it('accepts null answers for unanswered phases', () => {
    const result: ColoredDotsRoundResult = {
      correctColor: 'blue',
      phase1Answer: null,
      phase2Answer: null,
      phase1Correct: false,
      phase2Correct: false,
      phase1ResponseTimeMs: 0,
      phase2ResponseTimeMs: 0,
      dotCounts: { blue: 5, red: 3 },
      sizeStats: {
        blue: { total: 5, small: 0, normal: 5, large: 0 },
        red: { total: 3, small: 0, normal: 3, large: 0 },
      },
      sizeMode: 'uniform',
      largestDotColor: 'blue',
      pickedLargestDotColor: false,
      difficulty: 'medium',
    };

    expect(result.phase1Answer).toBeNull();
    expect(result.phase2Answer).toBeNull();
    expect(result.sizeMode).toBe('uniform');
  });

  it('dot counts can have varying number of colors', () => {
    const result3: ColoredDotsRoundResult = {
      correctColor: 'red',
      phase1Answer: 'red',
      phase2Answer: 'red',
      phase1Correct: true,
      phase2Correct: true,
      phase1ResponseTimeMs: 1000,
      phase2ResponseTimeMs: 1000,
      dotCounts: { red: 3, blue: 4, green: 2 },
      sizeStats: {
        red: { total: 3, small: 0, normal: 3, large: 0 },
        blue: { total: 4, small: 0, normal: 4, large: 0 },
        green: { total: 2, small: 0, normal: 2, large: 0 },
      },
      sizeMode: 'uniform',
      largestDotColor: 'blue',
      pickedLargestDotColor: false,
      difficulty: 'easy',
    };

    const result4: ColoredDotsRoundResult = {
      correctColor: 'red',
      phase1Answer: 'red',
      phase2Answer: 'red',
      phase1Correct: true,
      phase2Correct: true,
      phase1ResponseTimeMs: 800,
      phase2ResponseTimeMs: 900,
      dotCounts: { red: 3, blue: 4, green: 2, yellow: 5 },
      sizeStats: {
        red: { total: 3, small: 1, normal: 1, large: 1 },
        blue: { total: 4, small: 1, normal: 2, large: 1 },
        green: { total: 2, small: 0, normal: 2, large: 0 },
        yellow: { total: 5, small: 2, normal: 2, large: 1 },
      },
      sizeMode: 'biased',
      largestDotColor: 'yellow',
      pickedLargestDotColor: false,
      difficulty: 'hard',
    };

    expect(Object.keys(result3.dotCounts)).toHaveLength(3);
    expect(Object.keys(result4.dotCounts)).toHaveLength(4);
  });

  it('tracks size bias detection correctly', () => {
    const result: ColoredDotsRoundResult = {
      correctColor: 'red',
      phase1Answer: 'blue',
      phase2Answer: 'red',
      phase1Correct: false,
      phase2Correct: true,
      phase1ResponseTimeMs: 1200,
      phase2ResponseTimeMs: 800,
      dotCounts: { red: 8, blue: 6 },
      sizeStats: {
        red: { total: 8, small: 5, normal: 3, large: 0 },
        blue: { total: 6, small: 0, normal: 1, large: 5 },
      },
      sizeMode: 'biased',
      largestDotColor: 'blue',
      pickedLargestDotColor: true,
      difficulty: 'medium',
    };

    expect(result.pickedLargestDotColor).toBe(true);
    expect(result.largestDotColor).toBe('blue');
    expect(result.sizeStats.blue.large).toBeGreaterThan(result.sizeStats.red.large);
  });
});
