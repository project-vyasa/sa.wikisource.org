import fs from "node:fs/promises";
import path from "node:path";
import {
  ExtractedSuktaSchema,
  type ExtractedSukta,
} from "../schema/rigveda";
import {
  countSegmentsInBody,
  padapathaTokens,
  percentile100,
  segmentBitWidth,
} from "../schema/segments";

/**
 * Stage 5: Verify linguistic integrity; segment cardinality for graph-node packing.
 * Publication: `vyasac pack` / `publish` via `bun run build:rv`.
 *
 * See notes/verification.md and notes/variants-and-segments.md.
 */

const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const WORKSPACE_DIR = path.resolve("data/processed/rigveda");
const AUDIT_DIR = path.resolve("data/audit");

/** vyasac reserves 4 bits for sub-segment addressing (RFC-019). */
const COMPILER_SEGMENT_LIMIT = 15;

interface RikSegmentRow {
  mandala: string;
  sukta: string;
  rik: string;
  segments: number;
  source: "vy_pipe" | "padapatha" | "samhita_fallback";
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

async function readVyVerseBodies(
  stream: string,
  mandala: string,
  sukta: string,
): Promise<Map<string, string>> {
  const file = path.join(
    WORKSPACE_DIR,
    "content",
    stream,
    mandala,
    `${sukta}.vy`,
  );
  try {
    const content = await fs.readFile(file, "utf8");
    const map = new Map<string, string>();
    const re = /`v\s+(\d+)\s+(?:;[A-Z]+\s+)?\[([\s\S]*?)\](?:[A-Z]+)?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const rik = String(Number.parseInt(m[1], 10)).padStart(2, "0");
      map.set(rik, m[2].trim());
    }
    return map;
  } catch {
    return new Map();
  }
}

function rikRef(mandala: string, sukta: string, rik: string): string {
  return `${mandala}.${sukta}.${rik}`;
}

function segmentCountForRik(
  sukta: ExtractedSukta,
  rikId: string,
  vyBodies: Map<string, string>,
): RikSegmentRow {
  const rik = sukta.riks.find((r) => r.rik === rikId);
  const vyBody = vyBodies.get(rikId);

  if (vyBody?.includes("|")) {
    return {
      mandala: sukta.mandala,
      sukta: sukta.sukta,
      rik: rikId,
      segments: countSegmentsInBody(vyBody),
      source: "vy_pipe",
    };
  }

  const pada = rik?.padapatha_devanagari?.trim();
  if (pada) {
    return {
      mandala: sukta.mandala,
      sukta: sukta.sukta,
      rik: rikId,
      segments: padapathaTokens(pada).length,
      source: "padapatha",
    };
  }

  const sam = rik?.samhita_devanagari?.trim() ?? vyBody ?? "";
  return {
    mandala: sukta.mandala,
    sukta: sukta.sukta,
    rik: rikId,
    segments: countSegmentsInBody(sam),
    source: "samhita_fallback",
  };
}

async function auditSegments(): Promise<string> {
  const jsonFiles = await listExtractedJson();
  const rows: RikSegmentRow[] = [];
  const missingPadaRefs: string[] = [];
  const missingSayanaRefs: string[] = [];

  for (const file of jsonFiles) {
    const sukta = ExtractedSuktaSchema.parse(
      JSON.parse(await fs.readFile(file, "utf8")),
    );
    const vyPada = await readVyVerseBodies(
      "padapatha",
      sukta.mandala,
      sukta.sukta,
    );

    for (const r of sukta.riks) {
      rows.push(segmentCountForRik(sukta, r.rik, vyPada));
      const ref = rikRef(sukta.mandala, sukta.sukta, r.rik);
      if (!r.padapatha_devanagari) missingPadaRefs.push(ref);
      if (!r.sayanacharya_bhashya) missingSayanaRefs.push(ref);
    }
  }

  const counts = rows.map((r) => r.segments);
  const p100 = percentile100(counts);
  const bitWidth = segmentBitWidth(p100);
  const aboveLimitCount = rows.filter(
    (r) => r.segments > COMPILER_SEGMENT_LIMIT,
  ).length;

  const lines: string[] = [
    "Rig Veda — Verification Audit",
    `Generated: ${new Date().toISOString()}`,
    `Source: ${EXTRACTED_DIR}`,
    `Suktas audited: ${jsonFiles.length}`,
    `Riks audited: ${rows.length}`,
    "",
    "=== Segment counts (per rik leaf-block) ===",
    "Counts use padapatha danda tokens (or `|` in .vy when present).",
    `p100 (max segments per rik): ${p100}`,
    `segment_bit_width (ceil log2(p100+1)): ${bitWidth}`,
    `compiler_segment_limit: ${COMPILER_SEGMENT_LIMIT} (vyasac 4-bit sub-segment field; RFC-019)`,
    `riks above compiler limit (> ${COMPILER_SEGMENT_LIMIT}): ${aboveLimitCount}`,
    "",
    "=== Missing padapatha ===",
    `count: ${missingPadaRefs.length}`,
  ];

  if (missingPadaRefs.length === 0) {
    lines.push("(none)");
  } else {
    for (const ref of missingPadaRefs.sort()) {
      lines.push(`  ${ref}`);
    }
  }

  lines.push("", "=== Missing sayanacharya bhashya ===", `count: ${missingSayanaRefs.length}`);

  if (missingSayanaRefs.length === 0) {
    lines.push("(none)");
  } else {
    for (const ref of missingSayanaRefs.sort()) {
      lines.push(`  ${ref}`);
    }
  }

  lines.push(
    "",
    "Notes:",
    "- p100 informs future pack manifest config for graph-node segment ID bit packing.",
    "- Interlinear gloss requires `|` segment markers; padapatha tokens are the interim proxy.",
    "- Unaccented Devanagari: derive via stripVedicAccents; sandhi QA may need human-curated reference.",
    "",
  );

  return lines.join("\n");
}

export async function verifyAndPublishRigVeda() {
  await ensureDir(AUDIT_DIR);
  console.log(`[Verify] Auditing ${EXTRACTED_DIR} ...`);

  const report = await auditSegments();
  const outFile = path.join(AUDIT_DIR, "rigveda-segments-latest.txt");
  await fs.writeFile(outFile, report, "utf8");

  console.log(report);
  console.log(`[Verify] Report written → ${path.relative(process.cwd(), outFile)}`);
  console.log(
    `[Verify] Pack when ready: vyasac pack ${path.relative(process.cwd(), WORKSPACE_DIR)}`,
  );
}

if (import.meta.main) {
  verifyAndPublishRigVeda().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
