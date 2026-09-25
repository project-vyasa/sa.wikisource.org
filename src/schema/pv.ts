import { z } from "zod";

export const AdhyayaId = z.string().regex(/^\d{2}$/);
export const SectionId = z.string().regex(/^\d{2}$/);

export const ExtractedSectionSchema = z.object({
  section: SectionId,
  title: z.string().nullable(),
  body: z.string().min(1),
});

export const ExtractedAdhyayaSchema = z.object({
  source_url: z.string().url(),
  source_file: z.string(),
  adhyaya: AdhyayaId,
  sections: z.array(ExtractedSectionSchema).min(1),
});

export type ExtractedAdhyaya = z.infer<typeof ExtractedAdhyayaSchema>;
