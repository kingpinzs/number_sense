import { describe, expect, it } from 'vitest';

describe('Path alias resolution', () => {
  it('resolves @/shared/components/ui imports correctly', async () => {
    // This will throw if the path alias doesn't work
    const { Button } = await import('@/shared/components/ui/button');
    expect(Button).toBeDefined();
  });

  it('resolves @/shared/components/theme imports correctly', async () => {
    const { ThemeProbe } = await import('@/shared/components/theme/ThemeProbe');
    expect(ThemeProbe).toBeDefined();
  });

  it('resolves @/lib imports correctly', async () => {
    const utils = await import('@/lib/utils');
    expect(utils.cn).toBeDefined();
  });

  it('resolves @/shared/utils imports correctly', async () => {
    const { BREAKPOINTS } = await import('@/shared/utils/constants');
    expect(BREAKPOINTS).toBeDefined();
  });

  it('resolves context imports correctly', async () => {
    const { AppProvider, useApp } = await import('@/context/AppContext');
    expect(AppProvider).toBeDefined();
    expect(useApp).toBeDefined();
  });

  it('resolves route imports correctly', async () => {
    const Home = await import('@/routes/Home');
    expect(Home.default).toBeDefined();
    // 60s timeout: Home.tsx's import chain (useUserSettings + coach hooks) adds ~30ms
    // per module under parallel-suite resource contention. Passes in ~6s in isolation.
    // Tech debt: reduce Home.tsx import chain weight.
  }, 60000);
});
