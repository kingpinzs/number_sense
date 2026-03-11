/**
 * skipCountingAudio — Step-specific melodies for skip counting drills and games.
 *
 * Each skip-counting interval (2–12) gets its own distinct melody so that
 * learners associate a unique tune with each counting pattern:
 *   - By 2s → light, bouncy two-note pairs
 *   - By 3s → waltz-like triplet feel
 *   - By 4s → steady march in four
 *   - By 5s → bright pentatonic phrase
 *   - By 6s → lilting two groups of three
 *   - By 7s → playful seven-step motif
 *   - By 8s → descending scale in two groups of four
 *   - By 9s → three-by-three interlocking phrase
 *   - By 10s → triumphant ascending scale
 *   - By 11s → syncopated off-beat feel
 *   - By 12s → full-octave chromatic-tinged phrase
 *
 * Audio: Web Audio API (no external library). Sine wave oscillator with
 * exponential-decay gain envelope. All audio is wrapped in try/catch so
 * callers degrade gracefully when AudioContext is unavailable.
 */

// ─── Note frequencies (Hz) — C major scale, two octaves ─────────────────────

const NOTE = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
} as const;

// ─── Step-specific melodies ───────────────────────────────────────────────────
// Each array is a sequence of frequencies that cycle over the beat sequence.
// Short arrays repeat via modulo so they fit any sequence length.

export const STEP_MELODIES: Record<number, readonly number[]> = {
  // By 2s — light, bouncy pairs (C–E alternation)
  2:  [NOTE.C4, NOTE.E4, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.G4, NOTE.C5],

  // By 3s — waltz-like (stepwise triplet phrases)
  3:  [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.F4, NOTE.E4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.C5],

  // By 4s — steady march (C G E G pattern)
  4:  [NOTE.C4, NOTE.G4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4],

  // By 5s — bright pentatonic scale (C D E G A)
  5:  [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4],

  // By 6s — two groups of three, lilting
  6:  [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.G4, NOTE.E4,
       NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5, NOTE.A4, NOTE.F4],

  // By 7s — playful with a slight skip
  7:  [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.F4, NOTE.E4, NOTE.D4,
       NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4],

  // By 8s — descending scale in two groups of four
  8:  [NOTE.C5, NOTE.B4, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.E4, NOTE.D4, NOTE.C4],

  // By 9s — three groups of three, interlocking
  9:  [NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4,
       NOTE.E4, NOTE.G4, NOTE.C5],

  // By 10s — triumphant ascending scale
  10: [NOTE.C4, NOTE.D4, NOTE.E4, NOTE.F4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.C5],

  // By 11s — syncopated off-beat feel (skip wide intervals)
  11: [NOTE.C4, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.F4, NOTE.E4, NOTE.C4,
       NOTE.D4, NOTE.G4, NOTE.B4],

  // By 12s — full-octave phrase
  12: [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.B4, NOTE.C5, NOTE.B4, NOTE.G4, NOTE.E4,
       NOTE.D4, NOTE.F4, NOTE.A4, NOTE.C5],
} as const;

// ─── Fallback melody (used when step has no dedicated entry) ─────────────────

const FALLBACK_MELODY: readonly number[] = [
  NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.E4,
];

// ─── Audio helpers ────────────────────────────────────────────────────────────

/**
 * Create an AudioContext, returning null if the browser doesn't support it
 * (e.g. iOS before user gesture, or a Node test environment).
 */
export function tryCreateAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

/**
 * Play a single note from the step-specific melody at the given beat index.
 *
 * @param audioCtx - An AudioContext created by tryCreateAudioContext().
 * @param beatIndex - The zero-based index of the current beat in the sequence.
 * @param step - The skip-counting interval being practiced (e.g. 2, 5, 10).
 */
export function playStepMelodyNote(
  audioCtx: AudioContext,
  beatIndex: number,
  step: number
): void {
  try {
    const melody = STEP_MELODIES[step] ?? FALLBACK_MELODY;
    const freq = melody[beatIndex % melody.length];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.start();
    // Gentle exponential decay for a pleasant tone
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // Silently degrade — visual feedback continues without audio
  }
}
