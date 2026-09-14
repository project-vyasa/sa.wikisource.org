import fs from "node:fs/promises";
import path from "node:path";
import { EntityRegistry } from "../lib/entity-registry";
import { readVmltSukta, resolveSnapshotRoot } from "../lib/reference-snapshot";
import { suktaRef } from "../lib/anukramani";
import {
  ExtractedSuktaSchema,
  type ExtractedSukta,
} from "../schema/rigveda";
import { applyDisplayContextFromRoman } from "./apply-display-context";
import {
  buildAnukramaniSpansFromRoman,
  formatAnnotateLine,
  formatEntitiesVocabulary,
  formatFacetsVocabulary,
  formatMandalaAnnotationsFile,
  formatMetersVocabulary,
} from "./emit-anukramani";
import {
  loadSriAurobindoAnukramani,
  romanByRikFromSriAurobindo,
} from "../lib/sri-aurobindo-anukramani";
import { buildPerRikRoman } from "../lib/vmlt-ranges";

/**
 * Stage 4: Enrich Rig Veda workspace with VMLT anukramani (graph annotations).
 *
 * Usage:
 *   export REFERENCE_SNAPSHOTS=/path/to/reference-snapshot-001
 *   bun run enrich:rv
 */

const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const WORKSPACE_DIR = path.resolve("data/processed/rigveda");
const ANNOTATIONS_DIR = path.join(WORKSPACE_DIR, "annotations", "anukramani");
const VOCAB_DIR = path.join(WORKSPACE_DIR, "vocabulary");
const DEFAULT_SNAPSHOT_DATE = "2026-07-29";

async function listExtractedJson(): Promise<string[]> {
  const files: string[] = [];
  const mandalas = await fs.readdir(EXTRACTED_DIR).catch(() => [] as string[]);
  for (const mandalaDir of mandalas.sort()) {
    if (!/^\d{2}$/.test(mandalaDir)) continue;
    const dir = path.join(EXTRACTED_DIR, mandalaDir);
    for (const file of (await fs.readdir(dir)).sort()) {
      if (file.endsWith(".json")) files.push(path.join(dir, file));
    }
  }
  return files;
}

export interface EnrichStats {
  suktas: number;
  spans: number;
  uniformDisplay: number;
  mixedDisplay: number;
  skipped: number;
  entities: number;
  meters: number;
}

export async function enrichRigVeda(
  snapshotDate = process.env.REFERENCE_SNAPSHOT_DATE?.trim() ||
    DEFAULT_SNAPSHOT_DATE,
): Promise<EnrichStats> {
  const snapshotRoot = resolveSnapshotRoot();
  const registry = new EntityRegistry();
  const linesByMandala = new Map<string, string[]>();

  const stats: EnrichStats = {
    suktas: 0,
    spans: 0,
    uniformDisplay: 0,
    mixedDisplay: 0,
    skipped: 0,
    entities: 0,
    meters: 0,
  };

  const sriAurobindo = await loadSriAurobindoAnukramani();
  console.log(`[Enrich] Workspace: ${WORKSPACE_DIR}`);
  if (sriAurobindo) {
    console.log(
      `[Enrich] Anukramani source: sri-aurobindo.co.in (${sriAurobindo.size} sukta(s))`,
    );
  } else {
    console.log(`[Enrich] VMLT snapshot: ${snapshotRoot} (${snapshotDate})`);
  }

  for (const file of await listExtractedJson()) {
    const sukta = ExtractedSuktaSchema.parse(
      JSON.parse(await fs.readFile(file, "utf8")),
    ) as ExtractedSukta;

    const saKey = `${Number.parseInt(sukta.mandala, 10)}:${Number.parseInt(sukta.sukta, 10)}`;
    const saSukta = sriAurobindo?.get(saKey);

    let romanByRik = saSukta
      ? romanByRikFromSriAurobindo(saSukta, sukta.riks.length)
      : null;
    if (!romanByRik) {
      const vmlt = await readVmltSukta(
        snapshotRoot,
        snapshotDate,
        sukta.mandala,
        sukta.sukta,
      );
      if (!vmlt?.info) {
        stats.skipped += 1;
        continue;
      }
      romanByRik = buildPerRikRoman(vmlt.info, sukta.riks.length);
    }

    const spans = buildAnukramaniSpansFromRoman(
      sukta.mandala,
      sukta.sukta,
      sukta.riks.length,
      romanByRik,
      registry,
    );
    if (spans.length === 0) {
      stats.skipped += 1;
      continue;
    }

    stats.suktas += 1;
    stats.spans += spans.length;

    const mandalaKey = sukta.mandala;
    if (!linesByMandala.has(mandalaKey)) linesByMandala.set(mandalaKey, []);
    const bucket = linesByMandala.get(mandalaKey)!;
    bucket.push("");
    bucket.push(`// Sukta ${suktaRef(sukta.mandala, sukta.sukta)}`);
    for (const span of spans) {
      bucket.push(formatAnnotateLine(span));
    }

    const display = await applyDisplayContextFromRoman(
      WORKSPACE_DIR,
      sukta.mandala,
      sukta.sukta,
      romanByRik,
      sukta.riks.length,
      registry,
    );
    if (display.mode === "uniform") stats.uniformDisplay += 1;
    else if (display.mode === "mixed") stats.mixedDisplay += 1;
    else stats.skipped += 1;
  }

  await fs.mkdir(ANNOTATIONS_DIR, { recursive: true });
  for (const [mandala, lines] of [...linesByMandala.entries()].sort()) {
    const out = path.join(ANNOTATIONS_DIR, `${mandala}.vy`);
    await fs.writeFile(
      out,
      formatMandalaAnnotationsFile(mandala, lines, snapshotDate),
      "utf8",
    );
  }

  await fs.mkdir(VOCAB_DIR, { recursive: true });
  await fs.writeFile(
    path.join(VOCAB_DIR, "entities.vy"),
    formatEntitiesVocabulary(registry),
    "utf8",
  );
  await fs.writeFile(
    path.join(VOCAB_DIR, "meters.vy"),
    formatMetersVocabulary(registry),
    "utf8",
  );
  await fs.writeFile(
    path.join(VOCAB_DIR, "facets.vy"),
    formatFacetsVocabulary(),
    "utf8",
  );

  stats.entities = registry.entitiesOnly().length;
  stats.meters = registry.metersOnly().length;

  console.log(
    `[Enrich] ${stats.suktas} sukta(s), ${stats.spans} annotate span(s) → annotations/anukramani/`,
  );
  console.log(
    `[Enrich] Display context: uniform(denorm)=${stats.uniformDisplay} mixed(strip)=${stats.mixedDisplay} skipped=${stats.skipped}`,
  );
  console.log(
    `[Enrich] Vocabulary: ${stats.entities} entities, ${stats.meters} meters, facets → vocabulary/`,
  );

  return stats;
}

if (import.meta.main) {
  enrichRigVeda().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
