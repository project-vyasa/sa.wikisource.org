import fs from "node:fs/promises";
import path from "node:path";
import {
  isGarbageChandas,
  normalizeAnukramaniKey,
  suktaRef,
} from "../lib/anukramani";
import { readVmltSukta, resolveSnapshotRoot } from "../lib/reference-snapshot";
import { devanagariToIast, fuzzyNamesMatch, latinCompareKey } from "../lib/transliterate";
import {
  ExtractedSuktaSchema,
  type ExtractedSukta,
} from "../schema/rigveda";

/**
 * Triangulate Wikisource extract anukramani against VMLT Firebase snapshots.
 *
 * Usage:
 *   export REFERENCE_SNAPSHOTS=/path/to/reference-snapshot-001
 *   bun run triangulate:rv
 *   bun run triangulate:rv -- --date 2026-07-29
 */

const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const AUDIT_DIR = path.resolve("data/audit");
const DEFAULT_SNAPSHOT_DATE = "2026-07-29";

interface CliOptions {
  date: string;
}

function parseArgs(argv: string[]): CliOptions {
  let date = process.env.REFERENCE_SNAPSHOT_DATE?.trim() || DEFAULT_SNAPSHOT_DATE;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--date" && argv[i + 1]) {
      date = argv[++i];
    }
  }
  return { date };
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
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

function namesMatch(ours: string | null, ref: string | undefined): boolean | null {
  return fuzzyNamesMatch(ours, ref);
}

function formatMismatchLines(items: string[], limit = 40): string[] {
  if (items.length === 0) return ["  (none)"];
  const head = items.slice(0, limit).map((r) => `  ${r}`);
  if (items.length > limit) {
    head.push(`  … and ${items.length - limit} more`);
  }
  return head;
}

function meterInReference(
  chandas: string | null,
  meters: string | undefined,
): boolean | null {
  if (!chandas?.trim() || !meters?.trim()) return null;
  const key = latinCompareKey(devanagariToIast(chandas));
  const ref = latinCompareKey(meters);
  return ref.includes(key);
}

interface AuditState {
  suktas: number;
  missingRishi: string[];
  missingDevata: string[];
  missingChandas: string[];
  garbageChandas: string[];
  rishiDupes: Map<string, string[]>;
  refMissing: string[];
  rishiMatched: number;
  devataMatched: number;
  rishiMismatch: string[];
  devataMismatch: string[];
  chandasMismatch: string[];
}

function trackDupe(
  map: Map<string, string[]>,
  value: string,
  ref: string,
) {
  const key = normalizeAnukramaniKey(value);
  const list = map.get(key) ?? [];
  if (!list.includes(ref)) list.push(ref);
  map.set(key, list);
}

export async function triangulateRigVeda(opts?: CliOptions) {
  const { date } = opts ?? parseArgs(process.argv.slice(2));
  const snapshotRoot = resolveSnapshotRoot();

  await ensureDir(AUDIT_DIR);
  const jsonFiles = await listExtractedJson();
  const state: AuditState = {
    suktas: jsonFiles.length,
    missingRishi: [],
    missingDevata: [],
    missingChandas: [],
    garbageChandas: [],
    rishiDupes: new Map(),
    refMissing: [],
    rishiMatched: 0,
    devataMatched: 0,
    rishiMismatch: [],
    devataMismatch: [],
    chandasMismatch: [],
  };

  for (const file of jsonFiles) {
    const sukta = ExtractedSuktaSchema.parse(
      JSON.parse(await fs.readFile(file, "utf8")),
    ) as ExtractedSukta;
    const ref = suktaRef(sukta.mandala, sukta.sukta);
    const { rishi, devata, chandas } = sukta.anukramani;

    if (!rishi?.trim()) state.missingRishi.push(ref);
    else trackDupe(state.rishiDupes, rishi, ref);

    if (!devata?.trim()) state.missingDevata.push(ref);
    if (!chandas?.trim()) state.missingChandas.push(ref);
    if (isGarbageChandas(chandas)) {
      state.garbageChandas.push(`${ref} (${chandas})`);
    }

    const vmlt = await readVmltSukta(
      snapshotRoot,
      date,
      sukta.mandala,
      sukta.sukta,
    );
    if (!vmlt) {
      state.refMissing.push(ref);
      continue;
    }

    const rishiOk = namesMatch(rishi, vmlt.info?.from);
    if (rishiOk === true) state.rishiMatched += 1;
    else if (rishiOk === false) {
      state.rishiMismatch.push(
        `${ref}  ours=${rishi} (${devanagariToIast(rishi!)})  ref=${vmlt.info?.from}`,
      );
    }

    const devataOk = namesMatch(devata, vmlt.info?.to);
    if (devataOk === true) state.devataMatched += 1;
    else if (devataOk === false) {
      state.devataMismatch.push(
        `${ref}  ours=${devata} (${devanagariToIast(devata!)})  ref=${vmlt.info?.to}`,
      );
    }

    const meterOk = meterInReference(chandas, vmlt.info?.meters);
    if (meterOk === false && chandas && !isGarbageChandas(chandas)) {
      state.chandasMismatch.push(
        `${ref}  ours=${chandas}  ref_meters=${vmlt.info?.meters}`,
      );
    }
  }

  const rishiSplitGroups = [...state.rishiDupes.entries()]
    .filter(([, refs]) => refs.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  const lines: string[] = [
    "Rig Veda — Anukramani triangulation audit",
    `Generated: ${new Date().toISOString()}`,
    `Extract: ${EXTRACTED_DIR}`,
    `Reference: ${snapshotRoot}/snapshots/vmlt-firebase/rigveda/${date}`,
    `Suktas audited: ${state.suktas}`,
    "",
    "=== Local extract gaps ===",
    `missing rishi: ${state.missingRishi.length}`,
    ...state.missingRishi.map((r) => `  ${r}`),
    "",
    `missing devata: ${state.missingDevata.length}`,
    ...state.missingDevata.map((r) => `  ${r}`),
    "",
    `missing chandas: ${state.missingChandas.length}`,
    ...state.missingChandas.map((r) => `  ${r}`),
    "",
    `garbage / non-canonical chandas: ${state.garbageChandas.length}`,
    ...state.garbageChandas.map((r) => `  ${r}`),
    "",
    "=== Rishi normalization splits (same key, multiple spellings) ===",
    `groups: ${rishiSplitGroups.length}`,
    ...rishiSplitGroups.slice(0, 30).map(
      ([key, refs]) => `  [${refs.length}] ${key} → ${refs.slice(0, 5).join(", ")}${refs.length > 5 ? "…" : ""}`,
    ),
    ...(rishiSplitGroups.length > 30
      ? [`  … and ${rishiSplitGroups.length - 30} more groups`]
      : []),
    "",
    "=== VMLT reference cross-check ===",
    `snapshot missing: ${state.refMissing.length}`,
    ...(state.refMissing.length ? state.refMissing.map((r) => `  ${r}`) : ["  (none)"]),
    "",
    `rishi matched vs info.from: ${state.rishiMatched}`,
    `rishi mismatch vs info.from: ${state.rishiMismatch.length}`,
    ...formatMismatchLines(state.rishiMismatch),
    "",
    `devata matched vs info.to: ${state.devataMatched}`,
    `devata mismatch vs info.to: ${state.devataMismatch.length}`,
    ...formatMismatchLines(state.devataMismatch),
    "",
    `canonical chandas not in ref meters: ${state.chandasMismatch.length}`,
    ...formatMismatchLines(state.chandasMismatch),
    "",
    "Notes:",
    "- VMLT names are romanized; comparison uses folded IAST keys.",
    "- Composite / per-verse meters may flag false chandas mismatches.",
    "- Use this report to drive Stage 4 patches, not extract overwrites.",
    "",
  ];

  const report = lines.join("\n");
  const outFile = path.join(AUDIT_DIR, "anukramani-diff-latest.txt");
  await fs.writeFile(outFile, report, "utf8");

  console.log(report);
  console.log(
    `[Triangulate] Report written → ${path.relative(process.cwd(), outFile)}`,
  );
}

if (import.meta.main) {
  triangulateRigVeda().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
