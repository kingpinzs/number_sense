// Real-World Tips Library Tests
// Validates tip structure, no duplicate IDs, module coverage, and selection logic

import { describe, it, expect } from 'vitest';
import { REAL_WORLD_TIPS, selectRealWorldTip } from './realWorldTips';

describe('REAL_WORLD_TIPS library', () => {
  it('has at least 40 tips', () => {
    expect(REAL_WORLD_TIPS.length).toBeGreaterThanOrEqual(40);
  });

  it('has no duplicate IDs', () => {
    const ids = REAL_WORLD_TIPS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every tip has all required fields', () => {
    for (const tip of REAL_WORLD_TIPS) {
      expect(tip.id).toBeTruthy();
      expect(tip.module).toBeTruthy();
      expect(tip.category).toBeTruthy();
      expect(tip.title).toBeTruthy();
      expect(tip.activity.length).toBeGreaterThan(10);
      expect(tip.why.length).toBeGreaterThan(10);
      expect(['easy', 'medium', 'advanced']).toContain(tip.difficulty);
    }
  });

  it('covers all modules', () => {
    const modules = new Set(REAL_WORLD_TIPS.map(t => t.module));
    expect(modules.has('number_line')).toBe(true);
    expect(modules.has('spatial_rotation')).toBe(true);
    expect(modules.has('math_operations')).toBe(true);
    expect(modules.has('general')).toBe(true);
  });

  it('has at least 6 tips per module', () => {
    const counts: Record<string, number> = {};
    for (const tip of REAL_WORLD_TIPS) {
      counts[tip.module] = (counts[tip.module] ?? 0) + 1;
    }
    expect(counts['number_line']).toBeGreaterThanOrEqual(6);
    expect(counts['spatial_rotation']).toBeGreaterThanOrEqual(6);
    expect(counts['math_operations']).toBeGreaterThanOrEqual(6);
    expect(counts['general']).toBeGreaterThanOrEqual(4);
  });

  it('has at least 2 difficulty levels per module', () => {
    const modules = ['number_line', 'spatial_rotation', 'math_operations'] as const;
    for (const mod of modules) {
      const difficulties = new Set(
        REAL_WORLD_TIPS.filter(t => t.module === mod).map(t => t.difficulty)
      );
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers all categories', () => {
    const categories = new Set(REAL_WORLD_TIPS.map(t => t.category));
    expect(categories.has('spatial')).toBe(true);
    expect(categories.has('number_sense')).toBe(true);
    expect(categories.has('math_confidence')).toBe(true);
    expect(categories.has('daily_life')).toBe(true);
  });
});

describe('selectRealWorldTip', () => {
  it('returns a tip for the weakest module when available', () => {
    const tip = selectRealWorldTip('spatial_rotation', [], null);
    expect(tip).not.toBeNull();
    expect(tip!.module).toBe('spatial_rotation');
  });

  it('filters out already-shown tips', () => {
    const spatialIds = REAL_WORLD_TIPS
      .filter(t => t.module === 'spatial_rotation')
      .map(t => t.id);
    const tip = selectRealWorldTip('spatial_rotation', spatialIds, null);
    expect(tip).not.toBeNull();
    expect(tip!.module).not.toBe('spatial_rotation');
  });

  it('returns null when all tips have been shown', () => {
    const allIds = REAL_WORLD_TIPS.map(t => t.id);
    const tip = selectRealWorldTip('number_line', allIds, null);
    expect(tip).toBeNull();
  });

  it('prefers matching difficulty for high accuracy', () => {
    const tip = selectRealWorldTip('math_operations', [], 85);
    expect(tip).not.toBeNull();
    const advancedTips = REAL_WORLD_TIPS.filter(
      t => t.module === 'math_operations' && t.difficulty === 'advanced'
    );
    if (advancedTips.length > 0) {
      expect(tip!.difficulty).toBe('advanced');
    }
  });

  it('prefers easy difficulty for low accuracy', () => {
    const tip = selectRealWorldTip('spatial_rotation', [], 30);
    expect(tip).not.toBeNull();
    const easyTips = REAL_WORLD_TIPS.filter(
      t => t.module === 'spatial_rotation' && t.difficulty === 'easy'
    );
    if (easyTips.length > 0) {
      expect(tip!.difficulty).toBe('easy');
    }
  });

  it('falls back to general tips when module tips exhausted', () => {
    const numberLineIds = REAL_WORLD_TIPS
      .filter(t => t.module === 'number_line')
      .map(t => t.id);
    const tip = selectRealWorldTip('number_line', numberLineIds, null);
    expect(tip).not.toBeNull();
    expect(tip!.module).not.toBe('number_line');
  });

  it('returns a general tip when weakestModule is null', () => {
    const tip = selectRealWorldTip(null, [], null);
    expect(tip).not.toBeNull();
    expect(tip!.module).toBe('general');
  });
});
