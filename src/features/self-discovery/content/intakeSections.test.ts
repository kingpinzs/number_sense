// Tests for Intake Sections content
// Testing: INTAKE_SECTIONS structure, field definitions, required properties

import { describe, it, expect } from 'vitest';
import { INTAKE_SECTIONS } from './intakeSections';
import type { IntakeFieldType } from '../types';

const VALID_FIELD_TYPES: IntakeFieldType[] = ['textarea', 'checkbox', 'text'];

describe('INTAKE_SECTIONS', () => {
  it('has exactly 13 sections', () => {
    expect(INTAKE_SECTIONS).toHaveLength(13);
  });

  it('every section has a non-empty id', () => {
    for (const section of INTAKE_SECTIONS) {
      expect(section.id).toBeTruthy();
      expect(section.id.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids for all sections', () => {
    const ids = INTAKE_SECTIONS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(13);
  });

  it('every section has a non-empty title', () => {
    for (const section of INTAKE_SECTIONS) {
      expect(section.title).toBeTruthy();
      expect(section.title.length).toBeGreaterThan(0);
    }
  });

  it('every section has a non-empty description', () => {
    for (const section of INTAKE_SECTIONS) {
      expect(section.description).toBeTruthy();
      expect(section.description.length).toBeGreaterThan(0);
    }
  });

  it('every section has at least one field', () => {
    for (const section of INTAKE_SECTIONS) {
      expect(section.fields.length).toBeGreaterThan(0);
    }
  });

  it('every field has a non-empty key', () => {
    for (const section of INTAKE_SECTIONS) {
      for (const field of section.fields) {
        expect(field.key).toBeTruthy();
        expect(field.key.length).toBeGreaterThan(0);
      }
    }
  });

  it('every field has a non-empty label', () => {
    for (const section of INTAKE_SECTIONS) {
      for (const field of section.fields) {
        expect(field.label).toBeTruthy();
        expect(field.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('every field has a valid type', () => {
    for (const section of INTAKE_SECTIONS) {
      for (const field of section.fields) {
        expect(VALID_FIELD_TYPES).toContain(field.type);
      }
    }
  });

  it('field keys are unique within each section', () => {
    for (const section of INTAKE_SECTIONS) {
      const keys = section.fields.map(f => f.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    }
  });

  it('has expected section ids in order', () => {
    const expectedIds = [
      'medications',
      'sensory',
      'early_childhood',
      'elementary',
      'emotional_behavioral',
      'high_school',
      'college_adult',
      'reasons_goals',
      'family_history',
      'strengths',
      'weaknesses',
      'future_goals',
      'occupation',
    ];

    expect(INTAKE_SECTIONS.map(s => s.id)).toEqual(expectedIds);
  });
});

describe('Individual Sections', () => {
  it('medications section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'medications');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
    expect(section!.fields.map(f => f.key)).toEqual(['medications', 'conditions']);
  });

  it('sensory section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'sensory');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
    expect(section!.fields.map(f => f.key)).toEqual(['vision', 'hearing', 'sensory_processing']);
  });

  it('early_childhood section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'early_childhood');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
  });

  it('elementary section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'elementary');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
  });

  it('emotional_behavioral section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'emotional_behavioral');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
  });

  it('high_school section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'high_school');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
  });

  it('college_adult section has 3 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'college_adult');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(3);
  });

  it('reasons_goals section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'reasons_goals');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('family_history section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'family_history');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('strengths section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'strengths');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('weaknesses section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'weaknesses');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('future_goals section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'future_goals');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('occupation section has 2 fields', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'occupation');
    expect(section).toBeDefined();
    expect(section!.fields).toHaveLength(2);
  });

  it('occupation section has a text type field', () => {
    const section = INTAKE_SECTIONS.find(s => s.id === 'occupation');
    expect(section).toBeDefined();
    const textField = section!.fields.find(f => f.type === 'text');
    expect(textField).toBeDefined();
    expect(textField!.key).toBe('current_job');
  });
});

describe('Field Types Distribution', () => {
  it('uses textarea as the predominant field type', () => {
    const allFields = INTAKE_SECTIONS.flatMap(s => s.fields);
    const textareaFields = allFields.filter(f => f.type === 'textarea');
    expect(textareaFields.length).toBeGreaterThan(allFields.length / 2);
  });

  it('has at least one text type field', () => {
    const allFields = INTAKE_SECTIONS.flatMap(s => s.fields);
    const textFields = allFields.filter(f => f.type === 'text');
    expect(textFields.length).toBeGreaterThanOrEqual(1);
  });

  it('total fields across all sections is 32', () => {
    const totalFields = INTAKE_SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
    expect(totalFields).toBe(32);
  });
});

describe('Placeholder Values', () => {
  it('every textarea field has a placeholder', () => {
    const allFields = INTAKE_SECTIONS.flatMap(s => s.fields);
    const textareaFields = allFields.filter(f => f.type === 'textarea');
    for (const field of textareaFields) {
      expect(field.placeholder).toBeTruthy();
      expect(field.placeholder!.length).toBeGreaterThan(0);
    }
  });

  it('every text field has a placeholder', () => {
    const allFields = INTAKE_SECTIONS.flatMap(s => s.fields);
    const textFields = allFields.filter(f => f.type === 'text');
    for (const field of textFields) {
      expect(field.placeholder).toBeTruthy();
      expect(field.placeholder!.length).toBeGreaterThan(0);
    }
  });
});
