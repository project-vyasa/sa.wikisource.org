import fs from "node:fs/promises";
import path from "node:path";
import {
  ExtractedSuktaSchema,
  type ExtractedSukta,
  pad2,
  pad3,
} from "../schema/rigveda";

/**
 * Stage 3: Transform extracted JSON into the Vyasa workspace under data/processed/rigveda.
 *
 * Usage:
 *   bun run transform:rv
 *   bun run src/transform/index.ts 1.1 1.185
 */

const EXTRACTED_DIR = path.resolve("data/extracted/rigveda");
const WORKSPACE_DIR = path.resolve("data/processed/rigveda");

/** Shown in book view when a stream block is absent in Wikisource HTML. */
const MISSING_STREAM_PLACEHOLDER =
  "— [not present in Wikisource source] —";

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function parseTarget(spec: string): { mandala: number; sukta: number } {
  const m = /^(\d{1,2})\.(\d{1,3})$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid sukta spec "${spec}"; expected M.S like 1.1`);
  return { mandala: Number(m[1]), sukta: Number(m[2]) };
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Emit a command body; use a delimited block when raw brackets/backticks appear. */
function emitBlock(cmd: string, arg: number | null, body: string): string {
  const needsDelim = body.includes("]") || body.includes("`");
  const head = arg == null ? `\`${cmd}` : `\`${cmd} ${arg}`;
  if (needsDelim) {
    return `${head} ;RV [\n${body}\n]RV`;
  }
  return `${head} [\n${body}\n]`;
}

function suktaDisplayId(mandala: string, sukta: string): string {
  return `${Number.parseInt(mandala, 10)}:${Number.parseInt(sukta, 10)}`;
}

function emitContext(sukta: ExtractedSukta): string {
  const display = suktaDisplayId(sukta.mandala, sukta.sukta);
  // Anukramani (rishi/devata/chandas) is applied by enrich:rv from VMLT — not Wikisource HTML.
  const fields: string[] = [
    `mandala = "${sukta.mandala}"`,
    `sukta = "${sukta.sukta}"`,
    `mandala.title = "Mandala ${Number.parseInt(sukta.mandala, 10)}"`,
    `sukta.title = "Sukta ${display}"`,
  ];
  const body = fields.map((f, i) => {
    const comma = i < fields.length - 1 ? "," : "";
    return `  ${f}${comma}`;
  }).join("\n");
  return `\`set context {\n${body}\n}\n`;
}

function emitSamhitaFile(sukta: ExtractedSukta): string {
  const parts = [emitContext(sukta)];
  for (const rik of sukta.riks) {
    const n = Number.parseInt(rik.rik, 10);
    parts.push(emitBlock("v", n, rik.samhita_devanagari));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

function emitPadapathaFile(sukta: ExtractedSukta): string {
  const parts = [emitContext(sukta)];
  for (const rik of sukta.riks) {
    const n = Number.parseInt(rik.rik, 10);
    const body = rik.padapatha_devanagari?.trim() || MISSING_STREAM_PLACEHOLDER;
    parts.push(emitBlock("v", n, body));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

function emitSayanaFile(sukta: ExtractedSukta): string {
  const parts = [emitContext(sukta)];
  const intro = sukta.anukramani.introduction?.trim();
  if (intro) {
    parts.push('`set { scope = "paratext" }');
    parts.push(emitBlock("bhashya", null, intro));
    parts.push("`set { scope = \"\" }");
    parts.push("");
  }
  for (const rik of sukta.riks) {
    const n = Number.parseInt(rik.rik, 10);
    const body =
      rik.sayanacharya_bhashya?.trim() || MISSING_STREAM_PLACEHOLDER;
    parts.push(emitBlock("v", n, body));
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

async function listExtracted(): Promise<string[]> {
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

async function transformOne(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  const sukta = ExtractedSuktaSchema.parse(JSON.parse(raw));

  for (const stream of ["samhita", "padapatha", "sayana"] as const) {
    const dir = path.join(WORKSPACE_DIR, "content", stream, sukta.mandala);
    await ensureDir(dir);
  }

  const base = `${sukta.sukta}.vy`;
  const writes: Array<[string, string]> = [
    [path.join(WORKSPACE_DIR, "content", "samhita", sukta.mandala, base), emitSamhitaFile(sukta)],
    [path.join(WORKSPACE_DIR, "content", "padapatha", sukta.mandala, base), emitPadapathaFile(sukta)],
    [path.join(WORKSPACE_DIR, "content", "sayana", sukta.mandala, base), emitSayanaFile(sukta)],
  ];

  for (const [out, body] of writes) {
    await fs.writeFile(out, body, "utf8");
  }

  return {
    mandala: sukta.mandala,
    sukta: sukta.sukta,
    riks: sukta.riks.length,
    files: writes.map(([f]) => path.relative(process.cwd(), f)),
  };
}

export async function transformRigVeda(targets?: string[]) {
  await ensureDir(path.join(WORKSPACE_DIR, "content"));
  console.log(`[Transform] Writing .vy under ${WORKSPACE_DIR}/content`);

  let files: string[];
  if (targets && targets.length > 0) {
    files = targets.map((spec) => {
      const { mandala, sukta } = parseTarget(spec);
      return path.join(EXTRACTED_DIR, pad2(mandala), `${pad2(mandala)}-${pad3(sukta)}.json`);
    });
  } else {
    files = await listExtracted();
    console.log(`[Transform] Found ${files.length} extracted sukta JSON file(s).`);
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const result = await transformOne(file);
      ok += 1;
      console.log(
        `[Transform] ${result.mandala}.${result.sukta}: ${result.riks} rik(s) → content/{samhita,padapatha,sayana}/${result.mandala}/${result.sukta}.vy`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `[Transform] FAILED ${path.relative(process.cwd(), file)}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`[Transform] Done. ok=${ok} failed=${failed}`);
}

if (import.meta.main) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  transformRigVeda(args.length ? args : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
