/**
 * Segment counting for verification and future graph-node ID packing.
 *
 * In Vyasa source, interlinear gloss alignment uses `|` (pipe) segment markers
 * within a leaf block (e.g. `` `v 1 [ word₁ | word₂ | … ] ``).
 * Padapatha danda-separated tokens are the primary proxy until gloss streams exist.
 */

/** Split padapatha into morphological tokens (danda / double-danda boundaries). */
export function padapathaTokens(text: string): string[] {
  return text
    .split(/[।॥]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Count alignment segments in Vyasa verse body text.
 * Uses explicit `|` markers when present; otherwise falls back to padapatha tokenization.
 */
export function countSegmentsInBody(body: string): number {
  const trimmed = body.trim();
  if (!trimmed) return 0;

  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean).length;
  }

  return padapathaTokens(trimmed).length;
}

/** p100 = maximum value (100th percentile). */
export function percentile100(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/** Bits needed to encode values 1..max inclusive (for manifest / encoder planning). */
export function segmentBitWidth(maxSegments: number): number {
  if (maxSegments <= 0) return 0;
  return Math.ceil(Math.log2(maxSegments + 1));
}
