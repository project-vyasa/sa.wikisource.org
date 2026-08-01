import { z } from "zod";

export const AnukramaniPatchEntrySchema = z.object({
  rishi: z.string().optional(),
  devata: z.string().optional(),
  chandas: z.string().optional(),
  /** Roman source strings from VMLT (audit trail). */
  source: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      meters: z.string().optional(),
    })
    .optional(),
});

export const AnukramaniPatchFileSchema = z.object({
  version: z.literal(1),
  source_id: z.string(),
  snapshot_date: z.string(),
  generated_at: z.string(),
  /** Keys like `5:44` (mandala:sukta without zero padding). */
  patches: z.record(AnukramaniPatchEntrySchema),
});

export type AnukramaniPatchEntry = z.infer<typeof AnukramaniPatchEntrySchema>;
export type AnukramaniPatchFile = z.infer<typeof AnukramaniPatchFileSchema>;
