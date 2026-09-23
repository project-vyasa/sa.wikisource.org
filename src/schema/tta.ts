import { z } from "zod";
import { pad2 } from "../lib/devanagari-numerals";

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
  prasna: PrasnaId,
  header: z.string().nullable(),
  anuvakas: z.array(ExtractedAnuvakaSchema).min(1),
});

export type ExtractedMantra = z.infer<typeof ExtractedMantraSchema>;
export type ExtractedAnuvaka = z.infer<typeof ExtractedAnuvakaSchema>;
export type ExtractedPrasna = z.infer<typeof ExtractedPrasnaSchema>;

/** Named spans inside TTA — views, not separate corpora. Dump numbering (8 praśnas). */
export const FEATURED_PRASNAS: Record<string, { key: string; title_sa: string }> = {
  "05": { key: "sikshavalli", title_sa: "शिक्षावल्ली" },
  "06": { key: "mahanarayana", title_sa: "महानारायणोपनिषत्" },
};

export const FEATURED_ANUVAKAS: Record<string, { key: string; title_sa: string }> = {
  "03.12": { key: "purusha_sukta", title_sa: "पुरुषसूक्तम्" },
};

export function prasnaTitle(prasna: string): string {
  const featured = FEATURED_PRASNAS[prasna];
  if (featured) return featured.title_sa;
  return `Praśna ${Number.parseInt(prasna, 10)}`;
}

export function anuvakaTitle(prasna: string, anuvaka: string): string {
  const featured = FEATURED_ANUVAKAS[`${prasna}.${anuvaka}`];
  if (featured) return featured.title_sa;
  return `Anuvāka ${Number.parseInt(prasna, 10)}.${Number.parseInt(anuvaka, 10)}`;
}

export { pad2 };
