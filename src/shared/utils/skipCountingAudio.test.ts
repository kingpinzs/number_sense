import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STEP_MELODIES, tryCreateAudioContext, playStepMelodyNote } from './skipCountingAudio';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { value: 0 },
  type: 'sine',
};

const mockGain = {
  connect: vi.fn(),
  gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
};

const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  currentTime: 0,
};

// Set up a working AudioContext mock at module scope (matches existing test patterns)
(globalThis as Record<string, unknown>).AudioContext = vi.fn(function () {
  return mockAudioContext;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('skipCountingAudio', () => {
  describe('STEP_MELODIES', () => {
    const allSteps = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    it('provides a melody for every supported skip-counting step', () => {
      for (const step of allSteps) {
        expect(STEP_MELODIES[step]).toBeDefined();
        expect(Array.isArray(STEP_MELODIES[step])).toBe(true);
      }
    });

    it('each melody contains at least one note (positive frequency)', () => {
      for (const step of allSteps) {
        const melody = STEP_MELODIES[step];
        expect(melody.length).toBeGreaterThan(0);
        for (const freq of melody) {
          expect(freq).toBeGreaterThan(0);
        }
      }
    });

    it('each step has a distinct melody (no two steps share the exact same note array)', () => {
      const serialised = allSteps.map(s => JSON.stringify(STEP_MELODIES[s]));
      const unique = new Set(serialised);
      expect(unique.size).toBe(allSteps.length);
    });
  });

  describe('tryCreateAudioContext', () => {
    it('returns an AudioContext when the browser supports it', () => {
      const ctx = tryCreateAudioContext();
      expect(ctx).not.toBeNull();
    });

    it('returns null when AudioContext is not available', () => {
      const original = (globalThis as Record<string, unknown>).AudioContext;
      delete (globalThis as Record<string, unknown>).AudioContext;
      const ctx = tryCreateAudioContext();
      expect(ctx).toBeNull();
      (globalThis as Record<string, unknown>).AudioContext = original;
    });

    it('returns null when AudioContext constructor throws', () => {
      const original = (globalThis as Record<string, unknown>).AudioContext;
      (globalThis as Record<string, unknown>).AudioContext = vi.fn(function () {
        throw new Error('AudioContext not allowed');
      });
      const ctx = tryCreateAudioContext();
      expect(ctx).toBeNull();
      (globalThis as Record<string, unknown>).AudioContext = original;
    });
  });

  describe('playStepMelodyNote', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('creates an oscillator and gain node and connects them', () => {
      playStepMelodyNote(mockAudioContext as unknown as AudioContext, 0, 2);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledOnce();
      expect(mockAudioContext.createGain).toHaveBeenCalledOnce();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('sets the oscillator frequency to the first note of the step melody', () => {
      playStepMelodyNote(mockAudioContext as unknown as AudioContext, 0, 5);
      const expectedFreq = STEP_MELODIES[5][0];
      expect(mockOscillator.frequency.value).toBe(expectedFreq);
    });

    it('cycles through the melody using modulo for large beat indices', () => {
      const melody = STEP_MELODIES[3];
      const beatIndex = melody.length + 2; // wraps around
      playStepMelodyNote(mockAudioContext as unknown as AudioContext, beatIndex, 3);
      expect(mockOscillator.frequency.value).toBe(melody[beatIndex % melody.length]);
    });

    it('uses the fallback melody for an unsupported step (no throw)', () => {
      // Step 99 has no entry — should not throw and should still set a frequency
      expect(() => {
        playStepMelodyNote(mockAudioContext as unknown as AudioContext, 0, 99);
      }).not.toThrow();
      expect(mockOscillator.frequency.value).toBeGreaterThan(0);
    });

    it('starts and schedules stop on the oscillator', () => {
      playStepMelodyNote(mockAudioContext as unknown as AudioContext, 0, 10);
      expect(mockOscillator.start).toHaveBeenCalledOnce();
      expect(mockOscillator.stop).toHaveBeenCalledOnce();
    });

    it('applies an exponential gain ramp for a pleasant decay', () => {
      playStepMelodyNote(mockAudioContext as unknown as AudioContext, 0, 4);
      expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        0.001,
        expect.any(Number)
      );
    });

    it('does not throw when AudioContext methods throw (silent degradation)', () => {
      const brokenCtx = {
        createOscillator: vi.fn(() => { throw new Error('boom'); }),
        createGain: vi.fn(),
        destination: {},
        currentTime: 0,
      };
      expect(() => {
        playStepMelodyNote(brokenCtx as unknown as AudioContext, 0, 2);
      }).not.toThrow();
    });
  });
});
