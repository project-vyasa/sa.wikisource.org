import { romanAnukramaniToDevanagari } from "./vmlt-anukramani";

/** Stable ASCII entity key from VMLT roman prose. */
export function entityKeyFromRoman(roman: string): string {
  const trimmed = roman.trim();
  if (!trimmed) return "";
  return trimmed
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type EntityKind = "entity" | "meter";

export interface EntityRecord {
  key: string;
  label: string;
  kind: EntityKind;
  /** Original VMLT roman (audit). */
  source?: string;
}

export class EntityRegistry {
  private readonly entities = new Map<string, EntityRecord>();

  registerRoman(roman: string, kind: EntityKind = "entity"): string {
    const source = roman.trim();
    if (!source) return "";
    const key = entityKeyFromRoman(source);
    if (!key) return "";
    const label = kind === "meter"
      ? romanAnukramaniToDevanagari(source)
      : romanAnukramaniToDevanagari(source);
    const existing = this.entities.get(key);
    if (!existing) {
      this.entities.set(key, { key, label, kind, source });
      return key;
    }
    if (existing.kind === "entity" && kind === "meter") {
      // Keep person/deity registration; meters may share orthography rarely.
      return key;
    }
    return key;
  }

  registerChandasKey(key: string, devanagariLabel: string, source?: string): string {
    if (!key) return "";
    const existing = this.entities.get(key);
    if (!existing) {
      this.entities.set(key, {
        key,
        label: devanagariLabel,
        kind: "meter",
        source,
      });
    }
    return key;
  }

  labelFor(key: string): string {
    return this.entities.get(key)?.label ?? key;
  }

  allRecords(): EntityRecord[] {
    return [...this.entities.values()].sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }

  entitiesOnly(): EntityRecord[] {
    return this.allRecords().filter((r) => r.kind === "entity");
  }

  metersOnly(): EntityRecord[] {
    return this.allRecords().filter((r) => r.kind === "meter");
  }
}
