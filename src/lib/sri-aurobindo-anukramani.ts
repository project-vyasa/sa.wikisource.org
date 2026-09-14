import fs from "node:fs/promises";
import path from "node:path";
import type { RikAnukramaniRoman } from "./vmlt-ranges";

export interface SriAurobindoRik {
  rik: number;
  devata: string | null;
  rishi: string | null;
  chandas: string | null;
  flags?: string[];
}

export interface SriAurobindoSukta {
  mandala: number;
  sukta: number;
  rik_count: number;
  file: string;
  raw: { to: string; from: string; metres: string };
  riks: SriAurobindoRik[];
}

export interface SriAurobindoCorpus {
  source: string;
  generated_at: string;
  sukta_count: number;
  rik_count: number;
  suktas: SriAurobindoSukta[];
}

export function defaultSriAurobindoAnukramaniPath(): string {
  return (
    process.env.ANUKRAMANI_JSON?.trim() ||
    path.resolve(
      import.meta.dir,
      "../../../sri-aurobindo.co.in/data/extracted/anukramani.json",
    )
  );
}

export async function loadSriAurobindoAnukramani(
  jsonPath = defaultSriAurobindoAnukramaniPath(),
): Promise<Map<string, SriAurobindoSukta> | null> {
  try {
    const raw = JSON.parse(await fs.readFile(jsonPath, "utf8")) as SriAurobindoCorpus;
    const index = new Map<string, SriAurobindoSukta>();
    for (const sukta of raw.suktas ?? []) {
      index.set(`${sukta.mandala}:${sukta.sukta}`, sukta);
    }
    return index;
  } catch {
    return null;
  }
}

export function romanByRikFromSriAurobindo(
  sukta: SriAurobindoSukta,
  rikCount: number,
): Map<number, RikAnukramaniRoman> {
  const out = new Map<number, RikAnukramaniRoman>();
  for (const row of sukta.riks) {
    if (row.rik < 1 || row.rik > rikCount) continue;
    const entry: RikAnukramaniRoman = {};
    if (row.rishi) entry.rishi = row.rishi;
    if (row.devata) entry.devata = row.devata;
    if (row.chandas) entry.chandas = row.chandas;
    out.set(row.rik, entry);
  }
  return out;
}
