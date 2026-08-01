import fs from "node:fs/promises";
import path from "node:path";
import { isGarbageChandas, suktaRef } from "../lib/anukramani";
import { readVmltSukta, resolveSnapshotRoot } from "../lib/reference-snapshot";
import {
  primaryChandasFromMeters,
  romanAnukramaniToDevanagari,
} from "../lib/vmlt-anukramani";
import {
  AnukramaniPatchFileSchema,
  type AnukramaniPatchEntry,
} from "../schema/anukramani-patch";
import {
  ExtractedSuktaSchema,
  type ExtractedSukta,
} from "../schema/rigveda";

const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const PATCH_FILE = path.resolve(
  "data/patches/rigveda/anukramani-vmlt.json",
);
const DEFAULT_SNAPSHOT_DATE = "2026-07-29";

function parseRef(ref: string): { mandala: string; sukta: string } {
  const m = /^(\d+):(\d+)$/.exec(ref);
  if (!m) throw new Error(`Invalid sukta ref ${ref}`);
  return {
    mandala: m[1].padStart(2, "0"),
    sukta: m[2].padStart(3, "0"),
  };
}

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

function patchEntryFromVmlt(
  sukta: ExtractedSukta,
  vmlt: NonNullable<Awaited<ReturnType<typeof readVmltSukta>>>,
): AnukramaniPatchEntry | null {
  const entry: AnukramaniPatchEntry = { source: {} };
  let changed = false;

  if (!sukta.anukramani.rishi?.trim() && vmlt.info?.from?.trim()) {
    entry.rishi = romanAnukramaniToDevanagari(vmlt.info.from);
    entry.source!.from = vmlt.info.from;
    changed = true;
  }

  if (!sukta.anukramani.devata?.trim() && vmlt.info?.to?.trim()) {
    entry.devata = romanAnukramaniToDevanagari(vmlt.info.to);
    entry.source!.to = vmlt.info.to;
    changed = true;
  }

  const chandas = sukta.anukramani.chandas;
  if (
    (!chandas?.trim() || isGarbageChandas(chandas)) &&
    vmlt.info?.meters?.trim()
  ) {
    const primary = primaryChandasFromMeters(vmlt.info.meters);
    if (primary) {
      entry.chandas = primary;
      entry.source!.meters = vmlt.info.meters;
      changed = true;
    }
  }

  if (!changed) return null;
  if (entry.source && Object.keys(entry.source).length === 0) {
    delete entry.source;
  }
  return entry;
}

export async function generateAnukramaniPatches(
  snapshotDate = process.env.REFERENCE_SNAPSHOT_DATE?.trim() ||
    DEFAULT_SNAPSHOT_DATE,
): Promise<{ patchFile: string; count: number }> {
  const snapshotRoot = resolveSnapshotRoot();
  const patches: Record<string, AnukramaniPatchEntry> = {};

  for (const file of await listExtractedJson()) {
    const sukta = ExtractedSuktaSchema.parse(
      JSON.parse(await fs.readFile(file, "utf8")),
    );
    const ref = suktaRef(sukta.mandala, sukta.sukta);
    const vmlt = await readVmltSukta(
      snapshotRoot,
      snapshotDate,
      sukta.mandala,
      sukta.sukta,
    );
    if (!vmlt) continue;

    const entry = patchEntryFromVmlt(sukta, vmlt);
    if (entry) patches[ref] = entry;
  }

  const patchDoc = AnukramaniPatchFileSchema.parse({
    version: 1,
    source_id: "vmlt-firebase",
    snapshot_date: snapshotDate,
    generated_at: new Date().toISOString(),
    patches,
  });

  await fs.mkdir(path.dirname(PATCH_FILE), { recursive: true });
  await fs.writeFile(PATCH_FILE, `${JSON.stringify(patchDoc, null, 2)}\n`, "utf8");

  return { patchFile: PATCH_FILE, count: Object.keys(patches).length };
}

export function parseSuktaRefToPaths(ref: string): {
  mandala: string;
  sukta: string;
} {
  return parseRef(ref);
}
