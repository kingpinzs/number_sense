import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportObservationsAsCSV } from './exportObservations';
import type { ExperimentObservation } from '@/services/storage/schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_OBSERVATIONS: ExperimentObservation[] = [
  {
    id: 1,
    experimentId: 'drill-timer-visibility',
    variantId: 'treatment',
    metric: 'drill_accuracy',
    value: 0.85,
    timestamp: '2026-03-08T10:00:00.000Z',
    userId: 'user-abc',
  },
  {
    id: 2,
    experimentId: 'drill-timer-visibility',
    variantId: 'control',
    metric: 'drill_speed',
    value: 3.2,
    timestamp: '2026-03-08T10:01:00.000Z',
    userId: 'user-abc',
  },
];

// ─── Setup ────────────────────────────────────────────────────────────────────

// jsdom does not implement URL.createObjectURL / URL.revokeObjectURL — define stubs
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn() });
}
if (typeof URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });
}

let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
// Captures the CSV string passed to new Blob([content])
let capturedBlobContent = '';

beforeEach(() => {
  mockAnchor = { href: '', download: '', click: vi.fn() };
  capturedBlobContent = '';

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLAnchorElement;
    return Object.getPrototypeOf(document).createElement.call(document, tag) as HTMLElement;
  });

  // Assign mock fns directly to avoid complex spy generic inference
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  URL.revokeObjectURL = vi.fn().mockReturnValue(undefined);

  // Intercept Blob constructor to capture content without FileReader
  const OriginalBlob = globalThis.Blob;
  vi.spyOn(globalThis, 'Blob').mockImplementation(function(parts?: BlobPart[], options?: BlobPropertyBag) {
    capturedBlobContent = (parts ?? []).join('');
    return new OriginalBlob(parts, options);
  });

  // Freeze date to 2026-03-08 for deterministic filename
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('exportObservationsAsCSV', () => {
  it('downloads a file when called', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });

  it('sets the correct filename with experimentId and date', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    expect(mockAnchor.download).toBe('experiment-drill-timer-visibility-2026-03-08.csv');
  });

  it('creates a blob with text/csv type', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    const [blob] = vi.mocked(URL.createObjectURL).mock.calls[0] as [Blob];
    // Verify blob was created with text/csv (instanceof not reliable when Blob is spied)
    expect(blob.type).toBe('text/csv');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('CSV content has the correct header row', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    const lines = capturedBlobContent.split('\n');
    expect(lines[0]).toBe('timestamp,userId,experimentId,variantId,metric,value');
  });

  it('CSV content has correct data rows in order', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    const lines = capturedBlobContent.split('\n');
    expect(lines[1]).toBe(
      '2026-03-08T10:00:00.000Z,user-abc,drill-timer-visibility,treatment,drill_accuracy,0.85'
    );
    expect(lines[2]).toBe(
      '2026-03-08T10:01:00.000Z,user-abc,drill-timer-visibility,control,drill_speed,3.2'
    );
  });

  it('produces header-only CSV for empty observations', () => {
    exportObservationsAsCSV('drill-timer-visibility', []);
    expect(capturedBlobContent).toBe('timestamp,userId,experimentId,variantId,metric,value');
  });

  it('revokes the object URL after triggering download', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('sets the anchor href to the object URL', () => {
    exportObservationsAsCSV('drill-timer-visibility', MOCK_OBSERVATIONS);
    expect(mockAnchor.href).toBe('blob:mock-url');
  });
});
