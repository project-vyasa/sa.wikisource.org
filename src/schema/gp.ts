import { z } from "zod";

export const UnitId = z.string().regex(/^\d{2}-\d{2}-\d{2}$/);
export const PadaId = z.string().regex(/^\d{2}$/);

export const ExtractedPadaSchema = z.object({
  pada: z.string(),
  marker: z.string(),
  body: z.string().min(1),
});

export const ExtractedUnitSchema = z.object({
  source_url: z.string().url(),
  source_file: z.string(),
  kanda: z.string().regex(/^\d{2}$/),
  unit: UnitId,
  prapathaka: z.string().regex(/^\d{2}$/),
  kandika: z.string().regex(/^\d{2}$/),
  padas: z.array(ExtractedPadaSchema).min(1),
});

export type ExtractedUnit = z.infer<typeof ExtractedUnitSchema>;
