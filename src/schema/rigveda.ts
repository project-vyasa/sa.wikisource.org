import { z } from "zod";

/** Zero-padded numeric path segments used in filenames and context. */
export const MandalaId = z.string().regex(/^\d{2}$/);
export const SuktaId = z.string().regex(/^\d{3}$/);
export const RikId = z.string().regex(/^\d{2}$/);

/** Vedic svara marks: Udatta (U+0951) and Anudatta (U+0952). */
export const VEDIC_ACCENT_RE = /[\u0951\u0952]/g;

/** Derive an unaccented Devanagari string from an accented one. */
export function stripVedicAccents(text: string): string {
  return text.replace(VEDIC_ACCENT_RE, "");
}

export const AnukramaniSchema = z.object({
  rishi: z.string().nullable(),
  devata: z.string().nullable(),
  chandas: z.string().nullable(),
  /** Free-text Sayana sukta introduction (vinayoga, anukramani prose). */
  introduction: z.string().nullable(),
});

export const ExtractedRikSchema = z.object({
  rik: RikId,
  /** Samhita Devanagari (accented when Wikisource provides svara marks). */
  samhita_devanagari: z.string().min(1),
  /**
   * Padapatha Devanagari, preferring the accented form when present.
   * Unaccented display text is derived via `stripVedicAccents`.
   */
  padapatha_devanagari: z.string().nullable(),
  /** Per-rik Sayanacharya bhashya (not derivable). */
  sayanacharya_bhashya: z.string().nullable(),
});

export const ExtractedSuktaSchema = z.object({
  source_url: z.string().url(),
  source_file: z.string(),
  mandala: MandalaId,
  sukta: SuktaId,
  anukramani: AnukramaniSchema,
  riks: z.array(ExtractedRikSchema).min(1),
});

export type Anukramani = z.infer<typeof AnukramaniSchema>;
export type ExtractedRik = z.infer<typeof ExtractedRikSchema>;
export type ExtractedSukta = z.infer<typeof ExtractedSuktaSchema>;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function pad3(n: number): string {
  return String(n).padStart(3, "0");
}
