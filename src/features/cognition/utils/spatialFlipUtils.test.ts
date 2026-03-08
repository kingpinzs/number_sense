import { describe, it, expect } from 'vitest';
import {
  generateQuestion,
  generateDistractors,
  getEncouragementMessage,
  getShapeSetForDifficulty,
  getRotationAnglesForDifficulty,
  shouldMirror,
  CHOICE_LABELS,
} from './spatialFlipUtils';
import { SPATIAL_FLIP_ROTATION_ANGLES, SPATIAL_FLIP_SHAPES } from '../types';

describe('spatialFlipUtils', () => {
  describe('getShapeSetForDifficulty', () => {
    it('returns SPATIAL_FLIP_SHAPES for each difficulty', () => {
      expect(getShapeSetForDifficulty('easy')).toEqual(SPATIAL_FLIP_SHAPES.easy);
      expect(getShapeSetForDifficulty('medium')).toEqual(SPATIAL_FLIP_SHAPES.medium);
      expect(getShapeSetForDifficulty('hard')).toEqual(SPATIAL_FLIP_SHAPES.hard);
    });

    it('excludes circle from all difficulties (rotationally symmetric)', () => {
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        expect(getShapeSetForDifficulty(difficulty)).not.toContain('circle');
      }
    });

    it('excludes square from easy (4-fold symmetry with 90° angles)', () => {
      expect(getShapeSetForDifficulty('easy')).not.toContain('square');
    });
  });

  describe('getRotationAnglesForDifficulty', () => {
    it('returns correct angles for easy', () => {
      expect(getRotationAnglesForDifficulty('easy')).toEqual(SPATIAL_FLIP_ROTATION_ANGLES.easy);
    });

    it('returns correct angles for medium', () => {
      expect(getRotationAnglesForDifficulty('medium')).toEqual(SPATIAL_FLIP_ROTATION_ANGLES.medium);
    });

    it('returns correct angles for hard', () => {
      expect(getRotationAnglesForDifficulty('hard')).toEqual(SPATIAL_FLIP_ROTATION_ANGLES.hard);
    });
  });

  describe('generateQuestion', () => {
    it('returns a question with exactly 4 choices', () => {
      const question = generateQuestion('medium');
      expect(question.choices).toHaveLength(4);
    });

    it('has exactly one correct answer among choices', () => {
      const question = generateQuestion('medium');
      const correctChoices = question.choices.filter(c => c.isCorrect);
      expect(correctChoices).toHaveLength(1);
    });

    it('correctIndex points to the correct choice', () => {
      const question = generateQuestion('medium');
      expect(question.choices[question.correctIndex].isCorrect).toBe(true);
    });

    it('correct choice uses the same shape as reference', () => {
      const question = generateQuestion('medium');
      const correct = question.choices.find(c => c.isCorrect)!;
      expect(correct.shape).toBe(question.referenceShape);
    });

    it('uses shapes from the correct difficulty set', () => {
      for (let i = 0; i < 10; i++) {
        const question = generateQuestion('easy');
        expect(SPATIAL_FLIP_SHAPES.easy).toContain(question.referenceShape);
      }
    });

    it('assigns sequential IDs 0-3 to choices', () => {
      const question = generateQuestion('medium');
      const ids = question.choices.map(c => c.id).sort();
      expect(ids).toEqual([0, 1, 2, 3]);
    });

    it('uses rotation angles valid for the difficulty', () => {
      const validAngles = SPATIAL_FLIP_ROTATION_ANGLES.easy;
      for (let i = 0; i < 10; i++) {
        const question = generateQuestion('easy');
        for (const choice of question.choices) {
          expect(validAngles).toContain(choice.rotationDegrees);
        }
      }
    });

    it('does not use mirroring for easy difficulty', () => {
      for (let i = 0; i < 20; i++) {
        const question = generateQuestion('easy');
        for (const choice of question.choices) {
          expect(choice.isMirrored).toBe(false);
        }
      }
    });

    it('correct answer is never trivially identical to reference (rotation=0 + no mirror)', () => {
      for (let i = 0; i < 50; i++) {
        const question = generateQuestion('medium');
        const correct = question.choices.find(c => c.isCorrect)!;
        const isTrivial = correct.rotationDegrees === 0 && !correct.isMirrored;
        expect(isTrivial).toBe(false);
      }
    });

    it('generates valid questions for hard difficulty', () => {
      const validAngles = SPATIAL_FLIP_ROTATION_ANGLES.hard;
      for (let i = 0; i < 20; i++) {
        const question = generateQuestion('hard');
        expect(question.choices).toHaveLength(4);
        expect(SPATIAL_FLIP_SHAPES.hard).toContain(question.referenceShape);
        const correctChoices = question.choices.filter(c => c.isCorrect);
        expect(correctChoices).toHaveLength(1);
        for (const choice of question.choices) {
          expect(validAngles).toContain(choice.rotationDegrees);
        }
      }
    });

    it('hard difficulty can produce mirrored correct answers', () => {
      let foundMirrored = false;
      for (let i = 0; i < 50; i++) {
        const question = generateQuestion('hard');
        const correct = question.choices.find(c => c.isCorrect)!;
        if (correct.isMirrored) {
          foundMirrored = true;
          break;
        }
      }
      expect(foundMirrored).toBe(true);
    });
  });

  describe('shouldMirror', () => {
    it('always returns false for easy difficulty', () => {
      for (let i = 0; i < 30; i++) {
        expect(shouldMirror('easy', 0)).toBe(false);
        expect(shouldMirror('easy', 90)).toBe(false);
        expect(shouldMirror('easy', 180)).toBe(false);
      }
    });

    it('only mirrors at rotation=0 for medium difficulty', () => {
      for (let i = 0; i < 30; i++) {
        // Non-zero rotation should never mirror on medium
        expect(shouldMirror('medium', 90)).toBe(false);
        expect(shouldMirror('medium', 180)).toBe(false);
        expect(shouldMirror('medium', 270)).toBe(false);
      }
    });

    it('can mirror at any rotation for hard difficulty', () => {
      // Run enough times that at least one hard mirror should trigger (50% chance)
      let mirroredAtNonZero = false;
      for (let i = 0; i < 50; i++) {
        if (shouldMirror('hard', 90)) {
          mirroredAtNonZero = true;
          break;
        }
      }
      expect(mirroredAtNonZero).toBe(true);
    });
  });

  describe('generateDistractors', () => {
    it('returns exactly 3 distractors', () => {
      const distractors = generateDistractors('lshape', false, 'medium');
      expect(distractors).toHaveLength(3);
    });

    it('all distractors are marked as not correct', () => {
      const distractors = generateDistractors('lshape', false, 'medium');
      for (const d of distractors) {
        expect(d.isCorrect).toBe(false);
      }
    });

    it('all distractors use different shapes from the reference', () => {
      for (let i = 0; i < 20; i++) {
        const distractors = generateDistractors('lshape', false, 'medium');
        for (const d of distractors) {
          expect(d.shape).not.toBe('lshape');
        }
      }
    });

    it('each distractor uses a unique shape', () => {
      for (let i = 0; i < 20; i++) {
        const distractors = generateDistractors('lshape', false, 'hard');
        const shapes = distractors.map(d => d.shape);
        const uniqueShapes = new Set(shapes);
        expect(uniqueShapes.size).toBe(3);
      }
    });
  });

  describe('getEncouragementMessage', () => {
    it('returns excellent message for >= 90% accuracy', () => {
      expect(getEncouragementMessage(90)).toBe('Excellent spatial reasoning!');
      expect(getEncouragementMessage(100)).toBe('Excellent spatial reasoning!');
    });

    it('returns strong message for >= 70% accuracy', () => {
      expect(getEncouragementMessage(70)).toBe('Strong mental rotation skills!');
      expect(getEncouragementMessage(80)).toBe('Strong mental rotation skills!');
    });

    it('returns good effort message for >= 50% accuracy', () => {
      expect(getEncouragementMessage(50)).toBe('Good effort! Keep practicing.');
      expect(getEncouragementMessage(60)).toBe('Good effort! Keep practicing.');
    });

    it('returns practice message for < 50% accuracy', () => {
      expect(getEncouragementMessage(40)).toBe("Mental rotation takes practice. You'll improve!");
      expect(getEncouragementMessage(0)).toBe("Mental rotation takes practice. You'll improve!");
    });
  });

  describe('CHOICE_LABELS', () => {
    it('has labels A, B, C, D', () => {
      expect(CHOICE_LABELS).toEqual(['A', 'B', 'C', 'D']);
    });
  });
});
