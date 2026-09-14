import { z } from "zod";
import { pad2, pad3 } from "../lib/devanagari-numerals";

export const AdhyayaId = z.string().regex(/^\d{2}$/);
export const PadaId = z.string().regex(/^\d{2}$/);
export const SutraId = z.string().regex(/^\d{3}$/);

export const ExtractedSutraSchema = z.object({
  sutra: SutraId,
  mula_devanagari: z.string().min(1),
  vyakhya_hindi: z.string().nullable(),
  udaharana: z.string().nullable(),
});

export const ExtractedPadaSchema = z.object({
  source_urls: z.object({
    mula: z.string().url(),
    vyakhya: z.string().url(),
  }),
  adhyaya: AdhyayaId,
  pada: PadaId,
  sutras: z.array(ExtractedSutraSchema).min(1),
});

export const ExtractedMaheshvaraSchema = z.object({
  source_url: z.string().url(),
  sutras: z.array(z.object({
    n: z.number().int().min(1).max(14),
    text: z.string().min(1),
  })).min(1),
});

export type ExtractedSutra = z.infer<typeof ExtractedSutraSchema>;
export type ExtractedPada = z.infer<typeof ExtractedPadaSchema>;
export type ExtractedMaheshvara = z.infer<typeof ExtractedMaheshvaraSchema>;

export { pad2, pad3 };
