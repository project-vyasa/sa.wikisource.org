import fs from "node:fs/promises";
import path from "node:path";
import type { EntityRegistry } from "../lib/entity-registry";
import { chandasKeyFromMeterProse } from "../lib/chandas-keys";
import {
  buildPerRikRoman,
  isUniformTriple,
} from "../lib/vmlt-ranges";

const CONTEXT_RE = /`set context \{([\s\S]*?)\}\n/;
const STREAMS = ["samhita", "padapatha", "sayana"] as const;

const ANUKRAMANI_CONTEXT_KEYS = [
  "sukta.rishi",
  "sukta.devata",
  "sukta.chandas",
] as const;

function escapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseContextFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of body.split("\n")) {
    const m = /^\s*([^=]+)=\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/.exec(line);
    if (m) fields.set(m[1].trim(), m[2].replace(/\\"/g, '"'));
  }
  return fields;
}

function emitContext(fields: Map<string, string>): string {
  const order = [
    "mandala",
    "sukta",
    "mandala.title",
    "sukta.title",
    "sukta.rishi",
    "sukta.devata",
    "sukta.chandas",
  ];
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const key of order) {
    const value = fields.get(key);
    if (value == null) continue;
    seen.add(key);
    lines.push(`  ${key} = "${escapeAttr(value)}"`);
  }

  for (const [key, value] of fields) {
    if (seen.has(key)) continue;
    lines.push(`  ${key} = "${escapeAttr(value)}"`);
  }

  const body = lines
    .map((line, i) => (i < lines.length - 1 ? `${line},` : line))
    .join("\n");
  return `\`set context {\n${body}\n}\n`;
}

function stripAnukramaniContext(fields: Map<string, string>): void {
  for (const key of ANUKRAMANI_CONTEXT_KEYS) fields.delete(key);
}

export interface DisplayContextPatch {
  rishi?: string;
  devata?: string;
  chandas?: string;
  /** When true, remove sukta-level anukramani from context (mixed suktas). */
  stripOnly?: boolean;
}

export function patchVyContext(
  content: string,
  patch: DisplayContextPatch,
): string {
  const match = CONTEXT_RE.exec(content);
  if (!match) throw new Error("No `set context` block found");

  const fields = parseContextFields(match[1]);
  if (patch.stripOnly) {
    stripAnukramaniContext(fields);
  } else {
    stripAnukramaniContext(fields);
    if (patch.rishi) fields.set("sukta.rishi", patch.rishi);
    if (patch.devata) fields.set("sukta.devata", patch.devata);
    if (patch.chandas) fields.set("sukta.chandas", patch.chandas);
  }

  return content.replace(CONTEXT_RE, emitContext(fields));
}

/**
 * Mixed suktas: strip sukta-level anukramani from `set context` (per-rik values
 * wait on graph-aware weave). Uniform suktas: denorm Devanagari labels into
 * `sukta.rishi` / `sukta.devata` / `sukta.chandas` for `{{ rishi }}` etc.
 */
export async function applyDisplayContextFromRoman(
  workspaceDir: string,
  mandala: string,
  sukta: string,
  romanByRik: Map<number, { rishi?: string; devata?: string; chandas?: string }>,
  rikCount: number,
  registry: EntityRegistry,
): Promise<{ updated: number; mode: "uniform" | "mixed" | "skip" }> {
  const keysByRik = new Map<
    number,
    { rishi: string; devata: string; chandas: string }
  >();

  for (let rik = 1; rik <= rikCount; rik++) {
    const roman = romanByRik.get(rik) ?? {};
    if (roman.rishi && roman.devata && roman.chandas) {
      keysByRik.set(rik, {
        rishi: roman.rishi,
        devata: roman.devata,
        chandas: roman.chandas,
      });
    }
  }

  const uniform = isUniformTriple(keysByRik, rikCount);
  if (!uniform && keysByRik.size === 0) {
    return { updated: 0, mode: "skip" };
  }

  const first = keysByRik.get(1);
  const patch: DisplayContextPatch = uniform && first
    ? labelsFromRoman(first, registry)
    : { stripOnly: true };

  let updated = 0;
  for (const stream of STREAMS) {
    const file = path.join(
      workspaceDir,
      "content",
      stream,
      mandala,
      `${sukta}.vy`,
    );
    try {
      const content = await fs.readFile(file, "utf8");
      const next = patchVyContext(content, patch);
      if (next !== content) {
        await fs.writeFile(file, next, "utf8");
        updated += 1;
      }
    } catch {
      // transform may not have run yet for this sukta
    }
  }

  return { updated, mode: uniform ? "uniform" : "mixed" };
}

export async function applyDisplayContextForSukta(
  workspaceDir: string,
  mandala: string,
  sukta: string,
  info: { from?: string; to?: string; meters?: string },
  rikCount: number,
  registry: EntityRegistry,
): Promise<{ updated: number; mode: "uniform" | "mixed" | "skip" }> {
  return applyDisplayContextFromRoman(
    workspaceDir,
    mandala,
    sukta,
    buildPerRikRoman(info, rikCount),
    rikCount,
    registry,
  );
}

function labelsFromRoman(
  roman: { rishi: string; devata: string; chandas: string },
  registry: EntityRegistry,
): DisplayContextPatch {
  const rishi = registry.registerRoman(roman.rishi, "entity");
  const devata = registry.registerRoman(roman.devata, "entity");
  const mapped = chandasKeyFromMeterProse(roman.chandas);
  const chandas = mapped
    ? registry.registerChandasKey(mapped.key, mapped.label, roman.chandas)
    : registry.registerRoman(roman.chandas, "meter");
  return {
    rishi: registry.labelFor(rishi),
    devata: registry.labelFor(devata),
    chandas: registry.labelFor(chandas),
  };
}
