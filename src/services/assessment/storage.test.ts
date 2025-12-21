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
      spatial: 3.33,
      operations: 5.0,
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

  it('calculates total questions as 10', async () => {
    const domainScores: DomainScores = {
      number_sense: 2.5,
      spatial: 1.67,
      operations: 3.33,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 4, seconds: 15 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.totalQuestions).toBe(10);
  });

  it('calculates correct answers from domain scores', async () => {
    // Number sense: 3 correct out of 4 = 3.75
    // Spatial: 2 correct out of 3 = 3.33
    // Operations: 3 correct out of 3 = 5.0
    // Total correct: 3 + 2 + 3 = 8
    const domainScores: DomainScores = {
      number_sense: 3.75,
      spatial: 3.33,
      operations: 5.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 6, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.correctAnswers).toBe(8);
  });

  it('identifies weak domains (score ≤ 2.5)', async () => {
    const domainScores: DomainScores = {
      number_sense: 1.25, // weak
      spatial: 2.5,       // weak (boundary)
      operations: 4.0,    // strong
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
      spatial: 3.0,       // moderate
      operations: 3.75,   // strong
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.strengths).toContain('operations');
    expect(assessment?.strengths).toHaveLength(1);
  });

  it('generates recommendations for weak domains', async () => {
    const domainScores: DomainScores = {
      number_sense: 1.25, // weak
      spatial: 5.0,       // strong
      operations: 3.33,   // moderate
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
      spatial: 3.0,
      operations: 3.0,
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
      spatial: 3.0,
      operations: 3.0,
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
      spatial: 3.0,
      operations: 3.0,
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
      spatial: 1.0,
      operations: 2.5,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toHaveLength(3);
    expect(assessment?.strengths).toHaveLength(0);
    expect(assessment?.recommendations).toHaveLength(3);
  });

  it('handles all domains strong', async () => {
    const domainScores: DomainScores = {
      number_sense: 5.0,
      spatial: 4.0,
      operations: 5.0,
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toHaveLength(0);
    expect(assessment?.strengths).toHaveLength(3);
    expect(assessment?.recommendations).toHaveLength(0);
  });

  it('handles boundary score values', async () => {
    const domainScores: DomainScores = {
      number_sense: 2.5,  // weak (boundary)
      spatial: 3.5,       // moderate (boundary)
      operations: 3.6,    // strong (just above boundary)
    };

    const id = await saveAssessmentResults({
      domainScores,
      completionTime: { minutes: 5, seconds: 0 },
    });

    const assessment = await db.assessments.get(id);
    expect(assessment?.weaknesses).toContain('number_sense');
    expect(assessment?.weaknesses).toHaveLength(1);
    expect(assessment?.strengths).toContain('operations');
    expect(assessment?.strengths).toHaveLength(1);
  });
});
