import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '../..');

describe('Folder structure', () => {
  describe('Feature folders', () => {
    it('creates assessment feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/assessment'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/assessment/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/assessment/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/assessment/types'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/assessment/index.ts'))).toBe(true);
    });

    it('creates training feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/training'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/training/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/training/drills'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/training/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/training/types'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/training/index.ts'))).toBe(true);
    });

    it('creates coach feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/coach'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/coach/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/coach/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/coach/content'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/coach/index.ts'))).toBe(true);
    });

    it('creates cognition feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/cognition'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/cognition/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/cognition/games'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/cognition/index.ts'))).toBe(true);
    });

    it('creates progress feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/progress'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/progress/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/progress/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/progress/types'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/progress/index.ts'))).toBe(true);
    });

    it('creates magic-minute feature folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/features/magic-minute'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/magic-minute/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/magic-minute/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/features/magic-minute/index.ts'))).toBe(true);
    });
  });

  describe('Shared folders', () => {
    it('creates shared folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/shared'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/components'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/components/ui'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/hooks'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/utils'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/types'))).toBe(true);
    });

    it('moves UI components to shared/components/ui', () => {
      expect(existsSync(join(projectRoot, 'src/shared/components/ui/button.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/components/ui/card.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/shared/components/ui/form.tsx'))).toBe(true);
    });
  });

  describe('Services folders', () => {
    it('creates services folder with subdirectories', () => {
      expect(existsSync(join(projectRoot, 'src/services'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/services/storage'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/services/telemetry'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/services/pwa'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/services/adaptiveDifficulty'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/services/research'))).toBe(true);
    });
  });

  describe('Context files', () => {
    it('creates context files', () => {
      expect(existsSync(join(projectRoot, 'src/context/AppContext.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/context/SessionContext.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/context/UserSettingsContext.tsx'))).toBe(true);
    });
  });

  describe('Route files', () => {
    it('creates route files', () => {
      expect(existsSync(join(projectRoot, 'src/routes/Home.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/routes/AssessmentRoute.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/routes/TrainingRoute.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/routes/ProgressRoute.tsx'))).toBe(true);
      expect(existsSync(join(projectRoot, 'src/routes/ProfileRoute.tsx'))).toBe(true);
    });
  });

  describe('Test directories', () => {
    it('creates test directories', () => {
      expect(existsSync(join(projectRoot, 'tests/e2e'))).toBe(true);
      expect(existsSync(join(projectRoot, 'tests/fixtures'))).toBe(true);
    });
  });
});
