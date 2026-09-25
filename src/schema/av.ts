import { z } from "zod";

export const KandaId = z.string().regex(/^\d{2}$/);
export const SuktaId = z.string().regex(/^\d{3}$/);
export const RikId = z.string().regex(/^\d{2}$/);

export const ExtractedRikSchema = z.object({
  rik: RikId,
  samhita_devanagari: z.string().min(1),
});

export const ExtractedSuktaSchema = z.object({
  source_url: z.string().url(),
  source_file: z.string(),
  kanda: KandaId,
  sukta: SuktaId,
  riks: z.array(ExtractedRikSchema).min(1),
});

export type ExtractedRik = z.infer<typeof ExtractedRikSchema>;
export type ExtractedSukta = z.infer<typeof ExtractedSuktaSchema>;

export function suktaTitle(kanda: string, sukta: string): string {
  return `Kāṇḍa ${Number.parseInt(kanda, 10)}, Sūkta ${Number.parseInt(sukta, 10)}`;
}
