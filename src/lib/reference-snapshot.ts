import fs from "node:fs/promises";
import path from "node:path";

export interface VmltSuktaSnapshot {
  info?: {
    from?: string;
    to?: string;
    meters?: string;
  };
  verses?: unknown[];
}

const DEFAULT_REPO = path.resolve(
  import.meta.dirname,
  "../../../reference-snapshot-001",
);

export function resolveSnapshotRoot(): string {
  return process.env.REFERENCE_SNAPSHOTS?.trim() || DEFAULT_REPO;
}

export function resolveVmltSuktaPath(
  root: string,
  date: string,
  mandala: string,
  sukta: string,
): string {
  const mm = mandala.padStart(2, "0");
  const sss = sukta.padStart(3, "0");
  return path.join(
    root,
    "snapshots",
    "vmlt-firebase",
    "rigveda",
    date,
    "data",
    mm,
    `${mm}-${sss}.json`,
  );
}

export async function readVmltSukta(
  root: string,
  date: string,
  mandala: string,
  sukta: string,
): Promise<VmltSuktaSnapshot | null> {
  const file = resolveVmltSuktaPath(root, date, mandala, sukta);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as VmltSuktaSnapshot;
  } catch {
    return null;
  }
}
