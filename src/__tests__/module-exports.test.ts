import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '../..');

describe('Module exports and placeholders', () => {
  describe('Feature index files', () => {
    it('assessment index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/assessment/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for assessment');
    });

    it('training index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/training/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for training');
    });

    it('coach index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/coach/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for coach');
    });

    it('cognition index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/cognition/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for cognition');
    });

    it('progress index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/progress/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for progress');
    });

    it('magic-minute index.ts contains placeholder comment', () => {
      const content = readFileSync(join(projectRoot, 'src/features/magic-minute/index.ts'), 'utf-8');
      expect(content).toContain('// Public API for magic-minute');
    });
  });

  describe('Context implementations (Story 1.5)', () => {
    it('AppContext is fully implemented', () => {
      const content = readFileSync(join(projectRoot, 'src/context/AppContext.tsx'), 'utf-8');
      expect(content).toContain('// AppContext - Global application state management');
      expect(content).toContain('export function AppProvider');
      expect(content).toContain('export function useApp');
    });

    it('SessionContext is fully implemented', () => {
      const content = readFileSync(join(projectRoot, 'src/context/SessionContext.tsx'), 'utf-8');
      expect(content).toContain('// SessionContext - Active training session');
      expect(content).toContain('export function SessionProvider');
      expect(content).toContain('export function useSession');
    });

    it('UserSettingsContext is fully implemented', () => {
      const content = readFileSync(join(projectRoot, 'src/context/UserSettingsContext.tsx'), 'utf-8');
      expect(content).toContain('// UserSettingsContext - User preferences');
      expect(content).toContain('export function UserSettingsProvider');
      expect(content).toContain('export function useUserSettings');
    });
  });

  describe('Route components', () => {
    it('Home route exports a default function component', () => {
      const content = readFileSync(join(projectRoot, 'src/routes/Home.tsx'), 'utf-8');
      expect(content).toContain('export default function Home()');
    });

    it('AssessmentRoute exports a default function component', () => {
      const content = readFileSync(join(projectRoot, 'src/routes/AssessmentRoute.tsx'), 'utf-8');
      expect(content).toContain('export default function AssessmentRoute()');
    });

    it('TrainingRoute exports a default function component', () => {
      const content = readFileSync(join(projectRoot, 'src/routes/TrainingRoute.tsx'), 'utf-8');
      expect(content).toContain('export default function TrainingRoute()');
    });

    it('ProgressRoute exports a default function component', () => {
      const content = readFileSync(join(projectRoot, 'src/routes/ProgressRoute.tsx'), 'utf-8');
      expect(content).toContain('export default function ProgressRoute()');
    });

    it('ProfileRoute exports a default function component', () => {
      const content = readFileSync(join(projectRoot, 'src/routes/ProfileRoute.tsx'), 'utf-8');
      expect(content).toContain('export default function ProfileRoute()');
    });
  });
});
