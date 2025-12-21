/**
 * Mistake Analysis Engine - Unit Tests
 * Story 4.1: Test coverage for mistake pattern detection
 */

import { describe, it, expect } from 'vitest';
import type { DrillResult } from '../storage/schemas';
import {
  type MistakeType,
  type Severity,
  type CategorizedMistake,
  type MistakePattern,
  type AnalysisResult,
  categorizeMistake,
  analyzeDrillResult,
  detectPattern,
  analyzeSession,
  generateRecommendation,
  createSessionAnalyzer,
} from './mistakeAnalyzer';

describe('Mistake Analyzer', () => {
  describe('categorizeMistake', () => {
    describe('Number Line Mistakes', () => {
      it('detects overestimation when user places too high', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 70,
          targetNumber: 50,
          userAnswer: 75,
          correctAnswer: 50,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.type).toBe('overestimation');
      });

      it('detects underestimation when user places too low', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 70,
          targetNumber: 50,
          userAnswer: 25,
          correctAnswer: 50,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.type).toBe('underestimation');
      });

      it('calculates minor severity for error < 5%', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 96,
          targetNumber: 50,
          userAnswer: 54,  // 4% error on 0-100 range
          correctAnswer: 50,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.severity).toBe('minor');
      });

      it('calculates moderate severity for error between 5-20%', () => {
        // On easy difficulty, range is 0-100
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 85,
          targetNumber: 50,
          userAnswer: 60,  // 10% error on 0-100 range = moderate
          correctAnswer: 50,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.severity).toBe('moderate');
      });

      it('calculates severe severity for error > 20%', () => {
        // On easy difficulty, range is 0-100
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 50,
          targetNumber: 50,
          userAnswer: 75,  // 25% error on 0-100 range = severe
          correctAnswer: 50,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.severity).toBe('severe');
      });
    });

    describe('Spatial Rotation Mistakes', () => {
      it('detects rotation confusion', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'spatial_rotation',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 4000,
          accuracy: 0,
          shapeType: 'triangle',
          rotationDegrees: 90,
          isMirrored: false,
          userAnswer: 'same',
          correctAnswer: 'different',
        };

        const categorized = categorizeMistake(result);
        expect(categorized.type).toBe('rotation_confusion');
      });

      it('detects mirror confusion when isMirrored is true', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'spatial_rotation',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 4000,
          accuracy: 0,
          shapeType: 'square',
          rotationDegrees: 0,
          isMirrored: true,
          userAnswer: 'same',
          correctAnswer: 'different',
        };

        const categorized = categorizeMistake(result);
        expect(categorized.type).toBe('mirror_confusion');
      });
    });

    describe('Math Operations Mistakes', () => {
      it('detects operation weakness for subtraction', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'math_operations',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 5000,
          accuracy: 0,
          operation: 'subtraction',
          problem: '15 - 8',
          userAnswer: 6,
          correctAnswer: 7,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.type).toBe('operation_weakness');
      });

      it('calculates severe severity for basic addition errors', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'math_operations',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 0,
          operation: 'addition',
          problem: '5 + 3',
          userAnswer: 7,
          correctAnswer: 8,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.severity).toBe('severe');
      });

      it('calculates minor severity for multiplication errors', () => {
        const result: DrillResult = {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'math_operations',
          difficulty: 'hard',
          isCorrect: false,
          timeToAnswer: 6000,
          accuracy: 0,
          operation: 'multiplication',
          problem: '12 × 7',
          userAnswer: 83,
          correctAnswer: 84,
        };

        const categorized = categorizeMistake(result);
        expect(categorized.severity).toBe('minor');
      });
    });
  });

  describe('analyzeDrillResult', () => {
    it('returns null for correct answers', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'easy',
        isCorrect: true,
        timeToAnswer: 2000,
        accuracy: 100,
        targetNumber: 50,
        userAnswer: 50,
        correctAnswer: 50,
      };

      const analyzed = analyzeDrillResult(result);
      expect(analyzed).toBeNull();
    });

    it('returns CategorizedMistake for incorrect answers', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 75,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      const analyzed = analyzeDrillResult(result);
      expect(analyzed).not.toBeNull();
      expect(analyzed).toHaveProperty('drillId');
      expect(analyzed).toHaveProperty('mistakeType');
      expect(analyzed).toHaveProperty('severity');
      expect(analyzed).toHaveProperty('timestamp');
      expect(analyzed).toHaveProperty('drillContext');
      expect(analyzed!.mistakeType).toBe('overestimation');
    });

    it('generates unique drillId using uuid', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 75,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      const analyzed1 = analyzeDrillResult(result);
      const analyzed2 = analyzeDrillResult(result);

      expect(analyzed1!.drillId).not.toBe(analyzed2!.drillId);
      expect(analyzed1!.drillId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('includes drill context with module and difficulty', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'math_operations',
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 5000,
        accuracy: 0,
        operation: 'multiplication',
        problem: '12 × 7',
        userAnswer: 83,
        correctAnswer: 84,
      };

      const analyzed = analyzeDrillResult(result);
      expect(analyzed!.drillContext.module).toBe('math_operations');
      expect(analyzed!.drillContext.difficulty).toBe('hard');
    });
  });

  describe('detectPattern', () => {
    it('detects pattern when 2+ same type mistakes in window', () => {
      const mistakes: CategorizedMistake[] = [
        {
          drillId: '1',
          mistakeType: 'overestimation',
          severity: 'moderate',
          timestamp: Date.now(),
          drillContext: { module: 'number_line', difficulty: 'medium' },
        },
        {
          drillId: '2',
          mistakeType: 'overestimation',
          severity: 'moderate',
          timestamp: Date.now(),
          drillContext: { module: 'number_line', difficulty: 'medium' },
        },
      ];

      const patterns = detectPattern(mistakes);
      expect(patterns.length).toBeGreaterThan(0);
      const pattern = patterns.find(p => p.patternType === 'overestimation');
      expect(pattern).toBeDefined();
      expect(pattern!.occurrences).toBe(2);
    });

    it('respects window size parameter', () => {
      const mistakes: CategorizedMistake[] = [];
      for (let i = 0; i < 10; i++) {
        mistakes.push({
          drillId: `${i}`,
          mistakeType: 'overestimation',
          severity: 'moderate',
          timestamp: Date.now() - (10 - i) * 1000,
          drillContext: { module: 'number_line', difficulty: 'medium' },
        });
      }

      const patterns = detectPattern(mistakes, 5);  // Only last 5
      const pattern = patterns.find(p => p.patternType === 'overestimation');
      expect(pattern!.recentDrills).toBe(5);
      expect(pattern!.occurrences).toBeLessThanOrEqual(5);
    });

    it('calculates confidence as occurrences / windowSize', () => {
      const mistakes: CategorizedMistake[] = [
        {
          drillId: '1',
          mistakeType: 'rotation_confusion',
          severity: 'severe',
          timestamp: Date.now(),
          drillContext: { module: 'spatial_rotation', difficulty: 'easy' },
        },
        {
          drillId: '2',
          mistakeType: 'rotation_confusion',
          severity: 'severe',
          timestamp: Date.now(),
          drillContext: { module: 'spatial_rotation', difficulty: 'easy' },
        },
        {
          drillId: '3',
          mistakeType: 'underestimation',
          severity: 'minor',
          timestamp: Date.now(),
          drillContext: { module: 'number_line', difficulty: 'medium' },
        },
      ];

      const patterns = detectPattern(mistakes, 5);
      const pattern = patterns.find(p => p.patternType === 'rotation_confusion');
      // With 3 mistakes and windowSize 5, actual window is 3, so confidence = 2/3
      expect(pattern!.confidence).toBeCloseTo(2 / 3, 2);
    });

    it('does not detect pattern with only 1 occurrence', () => {
      const mistakes: CategorizedMistake[] = [
        {
          drillId: '1',
          mistakeType: 'overestimation',
          severity: 'moderate',
          timestamp: Date.now(),
          drillContext: { module: 'number_line', difficulty: 'medium' },
        },
      ];

      const patterns = detectPattern(mistakes);
      expect(patterns.length).toBe(0);
    });
  });

  describe('analyzeSession', () => {
    it('produces complete AnalysisResult with all fields', () => {
      const results: DrillResult[] = [
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 75,
          targetNumber: 50,
          userAnswer: 75,
          correctAnswer: 50,
        },
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'medium',
          isCorrect: true,
          timeToAnswer: 2000,
          accuracy: 100,
          targetNumber: 25,
          userAnswer: 25,
          correctAnswer: 25,
        },
      ];

      const analysis = analyzeSession(results);
      expect(analysis).toHaveProperty('sessionId', 1);
      expect(analysis).toHaveProperty('analyzedAt');
      expect(analysis).toHaveProperty('mistakes');
      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis.mistakes.length).toBe(1);  // Only 1 incorrect
    });

    it('detects patterns across mixed drill results', () => {
      const results: DrillResult[] = [
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'medium',
          isCorrect: false,
          timeToAnswer: 3000,
          accuracy: 70,
          targetNumber: 50,
          userAnswer: 75,
          correctAnswer: 50,
        },
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'number_line',
          difficulty: 'hard',
          isCorrect: false,
          timeToAnswer: 3500,
          accuracy: 65,
          targetNumber: 80,
          userAnswer: 95,
          correctAnswer: 80,
        },
      ];

      const analysis = analyzeSession(results);
      expect(analysis.patterns.length).toBeGreaterThan(0);
      const overestimationPattern = analysis.patterns.find(p => p.patternType === 'overestimation');
      expect(overestimationPattern).toBeDefined();
      expect(overestimationPattern!.occurrences).toBe(2);
    });

    it('generates recommendations based on detected patterns', () => {
      const results: DrillResult[] = [
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'math_operations',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 5000,
          accuracy: 0,
          operation: 'subtraction',
          problem: '15 - 8',
          userAnswer: 6,
          correctAnswer: 7,
        },
        {
          sessionId: 1,
          timestamp: new Date().toISOString(),
          module: 'math_operations',
          difficulty: 'easy',
          isCorrect: false,
          timeToAnswer: 5500,
          accuracy: 0,
          operation: 'subtraction',
          problem: '12 - 5',
          userAnswer: 6,
          correctAnswer: 7,
        },
      ];

      const analysis = analyzeSession(results);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('subtraction') || r.includes('operation'))).toBe(true);
    });
  });

  // ============================================================================
  // New Tests for AC-1, AC-2, AC-3, AC-5 Implementation
  // ============================================================================

  describe('Number Line - magnitude_error and boundary_error', () => {
    it('detects magnitude_error on hard difficulty with large error', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 5000,
        accuracy: 50,
        targetNumber: 500,
        userAnswer: 850,  // 35% error on 0-1000 range
        correctAnswer: 500,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('magnitude_error');
    });

    it('detects boundary_error near lower boundary', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'easy',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 75,
        targetNumber: 5,  // Near 0 (within 10% of range)
        userAnswer: 20,   // >10% error
        correctAnswer: 5,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('boundary_error');
    });

    it('detects boundary_error near upper boundary', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'easy',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 75,
        targetNumber: 95,  // Near 100 (within 10% of range)
        userAnswer: 78,    // >10% error
        correctAnswer: 95,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('boundary_error');
    });

    it('uses difficulty-based range for severity calculation', () => {
      // On medium difficulty (0-500 range), 25 point error is 5% = moderate
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 90,
        targetNumber: 250,
        userAnswer: 275,  // 5% error on 0-500 range
        correctAnswer: 250,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.severity).toBe('moderate');
    });
  });

  describe('Spatial Rotation - complexity_threshold', () => {
    it('detects complexity_threshold for complex shapes on hard difficulty', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'spatial_rotation',
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 6000,
        accuracy: 0,
        shapeType: 'irregular_polygon',  // Complex shape
        rotationDegrees: 180,
        isMirrored: false,
        userAnswer: 'same',
        correctAnswer: 'different',
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('complexity_threshold');
    });

    it('calculates minor severity for complex shapes', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'spatial_rotation',
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 6000,
        accuracy: 0,
        shapeType: 'star',  // Complex shape
        rotationDegrees: 90,
        isMirrored: false,
        userAnswer: 'different',
        correctAnswer: 'same',
      };

      const categorized = categorizeMistake(result);
      expect(categorized.severity).toBe('minor');
    });

    it('calculates moderate severity for medium complexity shapes', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'spatial_rotation',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 4000,
        accuracy: 0,
        shapeType: 'hexagon',  // Medium complexity
        rotationDegrees: 90,
        isMirrored: false,
        userAnswer: 'same',
        correctAnswer: 'different',
      };

      const categorized = categorizeMistake(result);
      expect(categorized.severity).toBe('moderate');
    });
  });

  describe('Math Operations - magnitude_threshold and speed_accuracy_tradeoff', () => {
    it('detects speed_accuracy_tradeoff for fast wrong answers', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'math_operations',
        difficulty: 'easy',
        isCorrect: false,
        timeToAnswer: 1500,  // Under 2 seconds = fast
        accuracy: 0,
        operation: 'addition',
        problem: '7 + 5',
        userAnswer: 11,
        correctAnswer: 12,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('speed_accuracy_tradeoff');
    });

    it('detects magnitude_threshold for double-digit problems on medium', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'math_operations',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 5000,  // Not fast
        accuracy: 0,
        operation: 'addition',
        problem: '24 + 38',  // Double-digit
        userAnswer: 61,
        correctAnswer: 62,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('magnitude_threshold');
    });

    it('detects magnitude_threshold for triple-digit on hard', () => {
      const result: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'math_operations',
        difficulty: 'hard',
        isCorrect: false,
        timeToAnswer: 8000,
        accuracy: 0,
        operation: 'subtraction',
        problem: '245 - 128',  // Triple-digit
        userAnswer: 116,
        correctAnswer: 117,
      };

      const categorized = categorizeMistake(result);
      expect(categorized.type).toBe('magnitude_threshold');
    });
  });

  describe('generateRecommendation', () => {
    it('returns recommendation for pattern with high confidence', () => {
      const pattern: MistakePattern = {
        patternType: 'overestimation',
        occurrences: 3,
        recentDrills: 5,
        confidence: 0.6,
        detectedAt: Date.now(),
      };

      const rec = generateRecommendation(pattern);
      expect(rec).toContain('number line');
      expect(rec).toContain('too high');
    });

    it('returns null for pattern with low confidence', () => {
      const pattern: MistakePattern = {
        patternType: 'rotation_confusion',
        occurrences: 1,
        recentDrills: 5,
        confidence: 0.2,
        detectedAt: Date.now(),
      };

      const rec = generateRecommendation(pattern);
      expect(rec).toBeNull();
    });

    it('provides specific recommendation for each mistake type', () => {
      const types: MistakeType[] = [
        'magnitude_error',
        'boundary_error',
        'complexity_threshold',
        'magnitude_threshold',
        'speed_accuracy_tradeoff',
      ];

      for (const type of types) {
        const pattern: MistakePattern = {
          patternType: type,
          occurrences: 3,
          recentDrills: 5,
          confidence: 0.6,
          detectedAt: Date.now(),
        };

        const rec = generateRecommendation(pattern);
        expect(rec).not.toBeNull();
        expect(typeof rec).toBe('string');
      }
    });
  });

  describe('createSessionAnalyzer (AC-5: every 3 drills)', () => {
    it('triggers analysis after every 3 drills', () => {
      const analyzer = createSessionAnalyzer();

      const drillResult: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 70,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      // First 2 drills should not trigger
      expect(analyzer.addDrillResult(drillResult)).toBeNull();
      expect(analyzer.addDrillResult(drillResult)).toBeNull();

      // 3rd drill should trigger
      const result = analyzer.addDrillResult(drillResult);
      expect(result).not.toBeNull();
      expect(result!.mistakes.length).toBe(3);
    });

    it('maintains max buffer size of 10', () => {
      const analyzer = createSessionAnalyzer();

      const drillResult: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 70,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      // Add 15 drills (all mistakes)
      for (let i = 0; i < 15; i++) {
        analyzer.addDrillResult(drillResult);
      }

      const state = analyzer.getState();
      expect(state.mistakeBuffer.length).toBeLessThanOrEqual(10);
    });

    it('allows custom trigger interval', () => {
      const analyzer = createSessionAnalyzer({ triggerInterval: 5 });

      const drillResult: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 70,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      // 3rd drill should NOT trigger with interval 5
      analyzer.addDrillResult(drillResult);
      analyzer.addDrillResult(drillResult);
      expect(analyzer.addDrillResult(drillResult)).toBeNull();

      // 5th drill should trigger
      analyzer.addDrillResult(drillResult);
      const result = analyzer.addDrillResult(drillResult);
      expect(result).not.toBeNull();
    });

    it('resets state correctly', () => {
      const analyzer = createSessionAnalyzer();

      const drillResult: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'medium',
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 70,
        targetNumber: 50,
        userAnswer: 75,
        correctAnswer: 50,
      };

      analyzer.addDrillResult(drillResult);
      analyzer.addDrillResult(drillResult);

      analyzer.reset();

      const state = analyzer.getState();
      expect(state.drillCount).toBe(0);
      expect(state.mistakeBuffer.length).toBe(0);
      expect(state.lastAnalysis).toBeNull();
    });

    it('does not add correct answers to mistake buffer', () => {
      const analyzer = createSessionAnalyzer();

      const correctResult: DrillResult = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'number_line',
        difficulty: 'easy',
        isCorrect: true,
        timeToAnswer: 2000,
        accuracy: 100,
        targetNumber: 50,
        userAnswer: 50,
        correctAnswer: 50,
      };

      analyzer.addDrillResult(correctResult);
      analyzer.addDrillResult(correctResult);
      analyzer.addDrillResult(correctResult);

      const state = analyzer.getState();
      expect(state.drillCount).toBe(3);
      expect(state.mistakeBuffer.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('analyzeSession handles empty results array', () => {
      const analysis = analyzeSession([]);
      expect(analysis.sessionId).toBe(0);
      expect(analysis.mistakes).toEqual([]);
      expect(analysis.patterns).toEqual([]);
    });

    it('detectPattern handles empty mistakes array', () => {
      const patterns = detectPattern([]);
      expect(patterns).toEqual([]);
    });

    it('categorizeMistake throws for unknown module', () => {
      const result = {
        sessionId: 1,
        timestamp: new Date().toISOString(),
        module: 'unknown_module' as any,
        difficulty: 'easy' as const,
        isCorrect: false,
        timeToAnswer: 3000,
        accuracy: 0,
        userAnswer: 1,
        correctAnswer: 2,
      };

      expect(() => categorizeMistake(result)).toThrow('Unknown module type');
    });
  });
});
