// Assessment Results Storage Service
// Story 2.6: Store assessment results in Dexie before showing summary

import { z } from 'zod';
import { db } from '@/services/storage/db';
import type { DomainScores } from './scoring';
import type { Assessment } from '@/services/storage/schemas';

// Zod schema for runtime validation of domain scores
const DomainScoresSchema = z.object({
  number_sense: z.number().min(0).max(5),
  spatial: z.number().min(0).max(5),
  operations: z.number().min(0).max(5),
});

export interface AssessmentResults {
  domainScores: DomainScores;
  completionTime: {
    minutes: number;
    seconds: number;
  };
}

// Question counts per domain (from scoring algorithm)
const DOMAIN_QUESTION_COUNTS = {
  number_sense: 4,
  spatial: 3,
  operations: 3,
} as const;

/**
 * Saves assessment results to Dexie database
 * Stores domain scores as weaknesses/strengths arrays and recommendations
 *
 * @param results - Assessment results including domain scores and completion time
 * @returns Promise<number> - The ID of the saved assessment record
 */
export async function saveAssessmentResults(
  results: AssessmentResults
): Promise<number> {
  const { domainScores } = results;

  // Validate domain scores are within valid range (0-5)
  const validationResult = DomainScoresSchema.safeParse(domainScores);
  if (!validationResult.success) {
    throw new Error(`Invalid domain scores: ${validationResult.error.message}`);
  }

  // Calculate total questions and correct answers from domain scores
  // Formula: score = (correct / total) * 5
  // Reverse: correct = (score * total) / 5
  let totalQuestions = 0;
  let correctAnswers = 0;

  for (const [domain, score] of Object.entries(domainScores) as [keyof typeof DOMAIN_QUESTION_COUNTS, number][]) {
    const domainQuestionCount = DOMAIN_QUESTION_COUNTS[domain];
    totalQuestions += domainQuestionCount;

    // Calculate correct answers from score
    const correctForDomain = Math.round((score * domainQuestionCount) / 5);
    correctAnswers += correctForDomain;
  }

  // Categorize domains by score thresholds
  const weaknesses: string[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  // Categorize each domain
  for (const [domain, score] of Object.entries(domainScores)) {
    if (score <= 2.5) {
      weaknesses.push(domain);
      recommendations.push(`Focus on ${formatDomainName(domain)} (score: ${score.toFixed(1)}/5.0)`);
    } else if (score > 3.5) {
      strengths.push(domain);
    }
  }

  // Create assessment record
  const assessment: Assessment = {
    timestamp: new Date().toISOString(),
    status: 'completed',
    totalQuestions,
    correctAnswers,
    weaknesses,
    strengths,
    recommendations,
    userId: 'local_user',
  };

  // Save to Dexie
  const id = await db.assessments.add(assessment);

  return id;
}

/**
 * Format domain key to human-readable name
 */
function formatDomainName(domain: string): string {
  switch (domain) {
    case 'number_sense':
      return 'Number Sense';
    case 'spatial':
      return 'Spatial Awareness';
    case 'operations':
      return 'Operations';
    default:
      return domain;
  }
}
