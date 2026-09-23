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
  header: z.string().nullable(),
  mantras: z.array(ExtractedMantraSchema).min(1),
});

export const ExtractedPrasnaSchema = z.object({
  source_url: z.string().url(),
  kanda: KandaId,
  prasna: PrasnaId,
  header: z.string().nullable(),
  anuvakas: z.array(ExtractedAnuvakaSchema).min(1),
});

export type ExtractedMantra = z.infer<typeof ExtractedMantraSchema>;
export type ExtractedAnuvaka = z.infer<typeof ExtractedAnuvakaSchema>;
export type ExtractedPrasna = z.infer<typeof ExtractedPrasnaSchema>;

export function prasnaTitle(kanda: string, prasna: string): string {
  return `Praśna ${Number.parseInt(kanda, 10)}.${Number.parseInt(prasna, 10)}`;
}

export { pad2 };
