// Tests for TypeScript schema interfaces
// Testing: Interface structure, required/optional fields, type safety

import { describe, it, expect } from 'vitest';
import type {
  Session,
  Assessment,
  DrillResult,
  TelemetryLog,
  MagicMinuteSession,
  DifficultyHistory,
  Experiment,
  ExperimentObservation
} from './schemas';

describe('Schema Interfaces', () => {
  describe('Session Interface', () => {
    it('accepts valid session object', () => {
      const session: Session = {
        id: 1,
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'training',
        duration: 300000,
        completionStatus: 'completed',
        confidencePre: 5,
        confidencePost: 7,
        anxietyLevel: 3
      };

      expect(session.module).toBe('training');
      expect(session.completionStatus).toBe('completed');
    });

    it('accepts session without optional fields', () => {
      const session: Session = {
        timestamp: '2025-11-10T10:00:00.000Z',
        module: 'assessment',
        duration: 180000,
        completionStatus: 'paused'
      };

      expect(session.confidencePre).toBeUndefined();
      expect(session.confidencePost).toBeUndefined();
      expect(session.anxietyLevel).toBeUndefined();
    });

    it('accepts all completion status values', () => {
      const statuses: Session['completionStatus'][] = [
        'completed',
        'abandoned',
        'paused'
      ];

      statuses.forEach(status => {
        const session: Session = {
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'training',
          duration: 300000,
          completionStatus: status
        };
        expect(session.completionStatus).toBe(status);
      });
    });
  });

  describe('Assessment Interface', () => {
    it('accepts valid assessment object', () => {
      const assessment: Assessment = {
        id: 1,
        timestamp: '2025-11-10T10:00:00.000Z',
        status: 'completed',
        totalQuestions: 20,
        correctAnswers: 15,
        weaknesses: ['number-sense', 'spatial-rotation'],
        strengths: ['math-operations'],
        recommendations: ['Practice number line', 'Try spatial drills'],
        userId: 'local_user'
      };

      expect(assessment.weaknesses).toHaveLength(2);
      expect(assessment.strengths).toHaveLength(1);
      expect(assessment.userId).toBe('local_user');
    });

    it('enforces userId field', () => {
      const assessment: Assessment = {
        timestamp: '2025-11-10T10:00:00.000Z',
        status: 'in-progress',
        totalQuestions: 10,
        correctAnswers: 5,
        weaknesses: [],
        strengths: [],
        recommendations: [],
        userId: 'local_user'
      };

      expect(assessment.userId).toBe('local_user');
    });
  });

  describe('DrillResult Interface', () => {
    it('accepts valid drill result', () => {
      const drillResult: DrillResult = {
        id: 1,
        sessionId: 123,
        timestamp: '2025-11-10T10:05:00.000Z',
        module: 'number-line',
        drillType: 'estimation',
        correctAnswers: 8,
        totalQuestions: 10,
        averageResponseTime: 2500,
        difficultyLevel: 5
      };

      expect(drillResult.sessionId).toBe(123);
      expect(drillResult.difficultyLevel).toBe(5);
    });

    it('supports foreign key relationship via sessionId', () => {
      const sessionId = 42;
      const drillResult: DrillResult = {
        sessionId,
        timestamp: '2025-11-10T10:05:00.000Z',
        module: 'spatial-rotation',
        drillType: 'rotation',
        correctAnswers: 7,
        totalQuestions: 10,
        averageResponseTime: 3000,
        difficultyLevel: 6
      };

      expect(drillResult.sessionId).toBe(sessionId);
    });
  });

  describe('TelemetryLog Interface', () => {
    it('accepts valid telemetry log', () => {
      const log: TelemetryLog = {
        id: 1,
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'drill_completed',
        module: 'training',
        data: {
          accuracy: 0.8,
          duration_ms: 45000,
          drillType: 'number-line'
        },
        userId: 'local_user'
      };

      expect(log.event).toBe('drill_completed');
      expect(log.data.accuracy).toBe(0.8);
      expect(log.userId).toBe('local_user');
    });

    it('accepts arbitrary JSON data', () => {
      const log: TelemetryLog = {
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'custom_event',
        module: 'system',
        data: {
          nested: {
            values: [1, 2, 3],
            flag: true
          },
          message: 'test'
        },
        userId: 'local_user'
      };

      expect(log.data.nested.values).toEqual([1, 2, 3]);
    });
  });

  describe('MagicMinuteSession Interface', () => {
    it('accepts valid magic minute session', () => {
      const session: MagicMinuteSession = {
        id: 1,
        sessionId: 456,
        timestamp: '2025-11-10T10:15:00.000Z',
        targetedMistakes: ['off-by-one', 'sign-error'],
        challengesGenerated: 5,
        challengesCompleted: 4,
        successRate: 0.8,
        duration: 60000
      };

      expect(session.duration).toBe(60000);
      expect(session.successRate).toBe(0.8);
      expect(session.targetedMistakes).toHaveLength(2);
    });
  });

  describe('DifficultyHistory Interface', () => {
    it('accepts valid difficulty history entry', () => {
      const history: DifficultyHistory = {
        id: 1,
        sessionId: 789,
        timestamp: '2025-11-10T10:20:00.000Z',
        module: 'training',
        previousDifficulty: 5,
        newDifficulty: 6,
        reason: 'too_easy',
        userAccepted: true
      };

      expect(history.previousDifficulty).toBe(5);
      expect(history.newDifficulty).toBe(6);
      expect(history.userAccepted).toBe(true);
    });

    it('tracks difficulty adjustments', () => {
      const adjustments: DifficultyHistory[] = [
        {
          sessionId: 1,
          timestamp: '2025-11-10T10:00:00.000Z',
          module: 'training',
          previousDifficulty: 5,
          newDifficulty: 4,
          reason: 'too_hard',
          userAccepted: false
        },
        {
          sessionId: 1,
          timestamp: '2025-11-10T10:05:00.000Z',
          module: 'training',
          previousDifficulty: 4,
          newDifficulty: 5,
          reason: 'optimal',
          userAccepted: true
        }
      ];

      expect(adjustments).toHaveLength(2);
      expect(adjustments[1].newDifficulty).toBe(5);
    });
  });

  describe('Experiment Interface', () => {
    it('accepts valid experiment', () => {
      const experiment: Experiment = {
        id: 1,
        name: 'Drill Order Test',
        description: 'Testing optimal drill ordering',
        status: 'active',
        startDate: '2025-11-10T00:00:00.000Z',
        endDate: '2025-11-17T00:00:00.000Z',
        variants: ['control', 'variant_a', 'variant_b']
      };

      expect(experiment.variants).toHaveLength(3);
      expect(experiment.status).toBe('active');
    });

    it('accepts experiment without endDate', () => {
      const experiment: Experiment = {
        name: 'Ongoing Test',
        description: 'Long-running experiment',
        status: 'active',
        startDate: '2025-11-01T00:00:00.000Z',
        variants: ['control', 'variant_a']
      };

      expect(experiment.endDate).toBeUndefined();
    });

    it('accepts all experiment statuses', () => {
      const statuses: Experiment['status'][] = ['active', 'paused', 'completed'];

      statuses.forEach(status => {
        const experiment: Experiment = {
          name: 'Test',
          description: 'Test experiment',
          status,
          startDate: '2025-11-10T00:00:00.000Z',
          variants: ['control']
        };
        expect(experiment.status).toBe(status);
      });
    });
  });

  describe('ExperimentObservation Interface', () => {
    it('accepts valid observation', () => {
      const observation: ExperimentObservation = {
        id: 1,
        experimentId: 42,
        variantId: 'variant_a',
        timestamp: '2025-11-10T10:30:00.000Z',
        metric: 'completion_rate',
        value: 0.85,
        userId: 'local_user'
      };

      expect(observation.experimentId).toBe(42);
      expect(observation.variantId).toBe('variant_a');
      expect(observation.value).toBe(0.85);
      expect(observation.userId).toBe('local_user');
    });

    it('links to experiment via experimentId', () => {
      const experimentId = 123;
      const observations: ExperimentObservation[] = [
        {
          experimentId,
          variantId: 'control',
          timestamp: '2025-11-10T10:00:00.000Z',
          metric: 'completion_rate',
          value: 0.75,
          userId: 'local_user'
        },
        {
          experimentId,
          variantId: 'variant_a',
          timestamp: '2025-11-10T10:00:00.000Z',
          metric: 'completion_rate',
          value: 0.82,
          userId: 'local_user'
        }
      ];

      expect(observations.every(o => o.experimentId === experimentId)).toBe(true);
    });
  });

  describe('userId Field Consistency', () => {
    it('enforces local_user for Assessment', () => {
      const assessment: Assessment = {
        timestamp: '2025-11-10T10:00:00.000Z',
        status: 'completed',
        totalQuestions: 10,
        correctAnswers: 8,
        weaknesses: [],
        strengths: [],
        recommendations: [],
        userId: 'local_user'
      };

      expect(assessment.userId).toBe('local_user');
    });

    it('enforces local_user for TelemetryLog', () => {
      const log: TelemetryLog = {
        timestamp: '2025-11-10T10:00:00.000Z',
        event: 'test',
        module: 'system',
        data: {},
        userId: 'local_user'
      };

      expect(log.userId).toBe('local_user');
    });

    it('enforces local_user for ExperimentObservation', () => {
      const observation: ExperimentObservation = {
        experimentId: 1,
        variantId: 'control',
        timestamp: '2025-11-10T10:00:00.000Z',
        metric: 'test_metric',
        value: 1.0,
        userId: 'local_user'
      };

      expect(observation.userId).toBe('local_user');
    });
  });
});
