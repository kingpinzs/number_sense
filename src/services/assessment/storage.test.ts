// Assessment Storage Service Tests
// Story 2.6: Store assessment results in Dexie before showing summary

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveAssessmentResults } from './storage';
import { db } from '@/services/storage/db';
import type { DomainScores } from './scoring';

describe('saveAssessmentResults', () => {
  // Clean up database before and after each test
  beforeEach(async () => {
    await db.assessments.clear();
  });

  afterEach(async () => {
    await db.assessments.clear();
  });

  it('saves assessment results to Dexie', async () => {
    const domainScores: DomainScores = {
      number_sense: 3.75,
      place_value: 2.5,
      sequencing: 4.0,
      arithmetic: 5.0,
      spatial: 3.33,
      applied: 3.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 30 },
    });

    expect(id).toBeGreaterThan(0);

    // Verify record was saved
    const assessment = await db.assessments.get(id);
    expect(assessment).toBeDefined();
    expect(assessment?.status).toBe('completed');
  });

  it('calculates total questions as 18', async () => {
    const domainScores: DomainScores = {
      number_sense: 2.5,
      place_value: 3.0,
      sequencing: 2.0,
      arithmetic: 3.33,
      spatial: 1.67,
      applied: 4.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 4, seconds: 15 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.totalQuestions).toBe(18);
  });

  it('calculates correct answers from domain scores', async () => {
    // Each domain has 3 questions, correct = Math.round((score * 3) / 5)
    // Number sense: 3.75 → round(2.25) = 2
    // Place value: 2.5 → round(1.5) = 2
    // Sequencing: 4.0 → round(2.4) = 2
    // Arithmetic: 5.0 → round(3.0) = 3
    // Spatial: 3.33 → round(1.998) = 2
    // Applied: 3.0 → round(1.8) = 2
    // Total correct: 2 + 2 + 2 + 3 + 2 + 2 = 13
    const domainScores: DomainScores = {
      number_sense: 3.75,
      place_value: 2.5,
      sequencing: 4.0,
      arithmetic: 5.0,
      spatial: 3.33,
      applied: 3.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 6, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.correctAnswers).toBe(13);
  });

  it('identifies weak domains (score ≤ 2.5)', async () => {
    const domainScores: DomainScores = {
      number_sense: 1.25, // weak
      place_value: 3.0,   // moderate
      sequencing: 3.0,    // moderate
      arithmetic: 4.0,    // strong
      spatial: 2.5,       // weak (boundary)
      applied: 3.0,       // moderate
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toContain('number_sense');
    expect(assessment?.weaknesses).toContain('spatial');
    expect(assessment?.weaknesses).toHaveLength(2);
  });

  it('identifies strong domains (score > 3.5)', async () => {
    const domainScores: DomainScores = {
      number_sense: 2.5,  // weak
      place_value: 3.0,   // moderate
      sequencing: 3.0,    // moderate
      arithmetic: 3.75,   // strong
      spatial: 3.0,       // moderate
      applied: 3.0,       // moderate
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.strengths).toContain('arithmetic');
    expect(assessment?.strengths).toHaveLength(1);
  });

  it('generates recommendations for weak domains', async () => {
    const domainScores: DomainScores = {
      number_sense: 1.25, // weak
      place_value: 3.0,   // moderate
      sequencing: 3.0,    // moderate
      arithmetic: 3.33,   // moderate
      spatial: 5.0,       // strong
      applied: 3.0,       // moderate
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.recommendations).toHaveLength(1);
    expect(assessment?.recommendations[0]).toMatch(/Number Sense/);
    expect(assessment?.recommendations[0]).toMatch(/1.3/); // score formatted
  });

  it('sets status to completed', async () => {
    const domainScores: DomainScores = {
      number_sense: 3.0,
      place_value: 3.0,
      sequencing: 3.0,
      arithmetic: 3.0,
      spatial: 3.0,
      applied: 3.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.status).toBe('completed');
  });

  it('sets userId to local_user', async () => {
    const domainScores: DomainScores = {
      number_sense: 3.0,
      place_value: 3.0,
      sequencing: 3.0,
      arithmetic: 3.0,
      spatial: 3.0,
      applied: 3.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.userId).toBe('local_user');
  });

  it('includes timestamp in ISO format', async () => {
    const domainScores: DomainScores = {
      number_sense: 3.0,
      place_value: 3.0,
      sequencing: 3.0,
      arithmetic: 3.0,
      spatial: 3.0,
      applied: 3.0,
    };

    const beforeSave = new Date().toISOString();
    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });
    const afterSave = new Date().toISOString();

    const assessment = await db.assessments.get(id);
    expect(assessment?.timestamp).toBeDefined();
    expect(assessment!.timestamp >= beforeSave).toBe(true);
    expect(assessment!.timestamp <= afterSave).toBe(true);
  });

  it('handles all domains weak', async () => {
    const domainScores: DomainScores = {
      number_sense: 0.0,
      place_value: 1.5,
      sequencing: 2.0,
      arithmetic: 2.5,
      spatial: 1.0,
      applied: 0.5,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toHaveLength(6);
    expect(assessment?.strengths).toHaveLength(0);
    expect(assessment?.recommendations).toHaveLength(6);
  });

  it('handles all domains strong', async () => {
    const domainScores: DomainScores = {
      number_sense: 5.0,
      place_value: 4.0,
      sequencing: 4.5,
      arithmetic: 5.0,
      spatial: 4.0,
      applied: 3.75,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toHaveLength(0);
    expect(assessment?.strengths).toHaveLength(6);
    expect(assessment?.recommendations).toHaveLength(0);
  });

  it('handles boundary score values', async () => {
    const domainScores: DomainScores = {
      number_sense: 2.5,  // weak (boundary)
      place_value: 3.0,   // moderate
      sequencing: 3.0,    // moderate
      arithmetic: 3.6,    // strong (just above boundary)
      spatial: 3.5,       // moderate (boundary)
      applied: 3.0,       // moderate
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toContain('number_sense');
    expect(assessment?.weaknesses).toHaveLength(1);
    expect(assessment?.strengths).toContain('arithmetic');
    expect(assessment?.strengths).toHaveLength(1);
  });
});
