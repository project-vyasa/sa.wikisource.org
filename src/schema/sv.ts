import { z } from "zod";
import { pad2, pad3 } from "../lib/devanagari-numerals";

export const ArcikaId = z.string().regex(/^\d{2}$/);
export const PrapathakaId = z.string().regex(/^\d{2}$/);
export const SegmentId = z.string().regex(/^\d{2}$/);
export const MantraId = z.string().regex(/^\d{2,3}$/);

export const ExtractedMantraSchema = z.object({
  mantra: MantraId,
  samhita_devanagari: z.string().min(1),
});

export const ExtractedSegmentSchema = z.object({
  source_url: z.string().url(),
  arcika: ArcikaId,
  prapāṭhaka: PrapathakaId,
  segment: SegmentId,
  segment_kind: z.enum(["dasati", "ardha"]),
  header: z.string().nullable(),
  mantras: z.array(ExtractedMantraSchema).min(1),
});

export type ExtractedMantra = z.infer<typeof ExtractedMantraSchema>;
export type ExtractedSegment = z.infer<typeof ExtractedSegmentSchema>;

export function segmentTitle(
  arcika: string,
  prapāṭhaka: string,
  segment: string,
  kind: "dasati" | "ardha",
): string {
  const a = Number.parseInt(arcika, 10);
  const p = Number.parseInt(prapāṭhaka, 10);
  const s = Number.parseInt(segment, 10);
  const book = a === 1 ? "Pūrvārcika" : "Uttarārcika";
  const unit = kind === "dasati" ? "Daśati" : "Ardha";
  return `${book} ${p}.${s} (${unit})`;
}

export function formatMantraId(n: number): string {
  return n < 100 ? pad2(n) : pad3(n);
}

export { pad2, pad3 };
