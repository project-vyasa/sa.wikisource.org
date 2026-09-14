import { z } from "zod";
import { pad2 } from "../lib/devanagari-numerals";

export const KandaId = z.string().regex(/^\d{2}$/);
export const PrasnaId = z.string().regex(/^\d{2}$/);
export const AnuvakaId = z.string().regex(/^\d{2}$/);
export const MantraId = z.string().regex(/^\d{2}$/);

export const ExtractedMantraSchema = z.object({
  mantra: MantraId,
  samhita_devanagari: z.string().min(1),
});

export const ExtractedAnuvakaSchema = z.object({
  anuvaka: AnuvakaId,
  /** Dump `K.P.A.0` cue (counts / compacted recitation), not a leaf. */
  header: z.string().nullable(),
  mantras: z.array(ExtractedMantraSchema).min(1),
});

export const ExtractedPrasnaSchema = z.object({
  source_url: z.string().url(),
  kanda: KandaId,
  prasna: PrasnaId,
  /** Dump `K.P.0.0` title / praśna cue. */
  header: z.string().nullable(),
  anuvakas: z.array(ExtractedAnuvakaSchema).min(1),
});

export type ExtractedMantra = z.infer<typeof ExtractedMantraSchema>;
export type ExtractedAnuvaka = z.infer<typeof ExtractedAnuvakaSchema>;
export type ExtractedPrasna = z.infer<typeof ExtractedPrasnaSchema>;

/** Popular spans inside TTS — views, not separate corpora. */
export const FEATURED_PRASNAS: Record<
  string,
  { key: string; title_sa: string }
> = {
  "04.05": { key: "sri_rudram", title_sa: "श्रीरुद्रम्" },
  "04.07": { key: "camakam", title_sa: "चमकम्" },
};

export function featuredKey(kanda: string, prasna: string): string {
  return `${kanda}.${prasna}`;
}

export function prasnaTitle(kanda: string, prasna: string): string {
  const featured = FEATURED_PRASNAS[featuredKey(kanda, prasna)];
  if (featured) return featured.title_sa;
  return `Praśna ${Number.parseInt(kanda, 10)}.${Number.parseInt(prasna, 10)}`;
}

export { pad2 };
