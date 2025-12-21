// Assessment Storage Validation Tests
// Testing Zod schema validation for domain scores

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveAssessmentResults } from './storage';
import { db } from '@/services/storage/db';
import type { DomainScores } from './scoring';

describe('saveAssessmentResults - Validation', () => {
  beforeEach(async () => {
    await db.assessments.clear();
  });

  afterEach(async () => {
    await db.assessments.clear();
  });

  it('accepts valid domain scores within 0-5 range', async () => {
    const validScores: DomainScores = {
      number_sense: 3.5,
      spatial: 2.0,
      operations: 4.5,
    };

    const id = await saveAssessmentResults({
      domainScores: validScores,
      completionTime: { minutes: 5, seconds: 30 },
    });

    expect(id).toBeGreaterThan(0);
  });

  it('accepts boundary values (0 and 5)', async () => {
    const boundaryScores: DomainScores = {
      number_sense: 0,
      spatial: 5,
      operations: 2.5,
    };

    const id = await saveAssessmentResults({
      domainScores: boundaryScores,
      completionTime: { minutes: 5, seconds: 30 },
    });

    expect(id).toBeGreaterThan(0);
  });

  it('rejects scores above 5', async () => {
    const invalidScores: DomainScores = {
      number_sense: 6.0,
      spatial: 3.0,
      operations: 2.0,
    };

    await expect(
      saveAssessmentResults({
        domainScores: invalidScores,
        completionTime: { minutes: 5, seconds: 30 },
      })
    ).rejects.toThrow('Invalid domain scores');
  });

  it('rejects scores below 0', async () => {
    const invalidScores: DomainScores = {
      number_sense: 2.0,
      spatial: -1.0,
      operations: 3.0,
    };

    await expect(
      saveAssessmentResults({
        domainScores: invalidScores,
        completionTime: { minutes: 5, seconds: 30 },
      })
    ).rejects.toThrow('Invalid domain scores');
  });

  it('rejects non-numeric scores', async () => {
    const invalidScores = {
      number_sense: 'high' as any,
      spatial: 3.0,
      operations: 2.0,
    };

    await expect(
      saveAssessmentResults({
        domainScores: invalidScores,
        completionTime: { minutes: 5, seconds: 30 },
      })
    ).rejects.toThrow('Invalid domain scores');
  });
});
