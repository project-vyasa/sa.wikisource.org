import { z } from "zod";

export const VerseId = z.string().regex(/^\d{2}$/);

export const ExtractedVerseSchema = z.object({
  verse: VerseId,
  mula_devanagari: z.string().min(1),
});

export const ExtractedChapterSchema = z.object({
  source_url: z.string().url(),
  source_file: z.string(),
  chapter: z.string().min(1),
  title: z.string(),
  verses: z.array(ExtractedVerseSchema).min(1),
});

export type ExtractedChapter = z.infer<typeof ExtractedChapterSchema>;
