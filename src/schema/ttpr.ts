import { z } from "zod";
import { pad2, pad3 } from "../lib/devanagari-numerals";

export const AdhyayaId = z.string().regex(/^\d{2}$/);
export const SutraId = z.string().regex(/^\d{3}$/);

export const ExtractedSutraSchema = z.object({
  sutra: SutraId,
  mula_devanagari: z.string().min(1),
});

export const ExtractedAdhyayaSchema = z.object({
  source_url: z.string().url(),
  adhyaya: AdhyayaId,
  sutras: z.array(ExtractedSutraSchema).min(1),
});

export type ExtractedSutra = z.infer<typeof ExtractedSutraSchema>;
export type ExtractedAdhyaya = z.infer<typeof ExtractedAdhyayaSchema>;

export { pad2, pad3 };
