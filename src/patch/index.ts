import fs from "node:fs/promises";
import path from "node:path";
import { AnukramaniPatchFileSchema } from "../schema/anukramani-patch";
import { applyAnukramaniPatchToVy } from "./apply-context";
import { generateAnukramaniPatches } from "./generate-anukramani";

/**
 * @deprecated Use `enrich:rv` instead (graph annotations + vocabulary).
 * Legacy Stage 4: sukta-level context patches from VMLT gaps.
 */

const WORKSPACE_DIR = path.resolve("data/processed/rigveda");
const PATCH_FILE = path.resolve(
  "data/patches/rigveda/anukramani-vmlt.json",
);
const STREAMS = ["samhita", "padapatha", "sayana"] as const;

async function applyPatches() {
  const raw = JSON.parse(await fs.readFile(PATCH_FILE, "utf8"));
  const patchDoc = AnukramaniPatchFileSchema.parse(raw);

  let updated = 0;
  for (const [ref, entry] of Object.entries(patchDoc.patches)) {
    const m = /^(\d+):(\d+)$/.exec(ref);
    if (!m) continue;
    const mandala = m[1].padStart(2, "0");
    const sukta = m[2].padStart(3, "0");

    for (const stream of STREAMS) {
      const file = path.join(
        WORKSPACE_DIR,
        "content",
        stream,
        mandala,
        `${sukta}.vy`,
      );
      const content = await fs.readFile(file, "utf8");
      const next = applyAnukramaniPatchToVy(content, entry);
      if (next !== content) {
        await fs.writeFile(file, next, "utf8");
        updated += 1;
      }
    }

    const fields = [
      entry.rishi && `rishi=${entry.rishi}`,
      entry.devata && `devata=${entry.devata}`,
      entry.chandas && `chandas=${entry.chandas}`,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`[Patch] ${ref}: ${fields}`);
  }

  console.log(
    `[Patch] Applied ${Object.keys(patchDoc.patches).length} sukta patch(es); ${updated} .vy file(s) updated.`,
  );
}

export async function patchRigVeda() {
  console.log(`[Patch] Workspace: ${WORKSPACE_DIR}`);

  const { patchFile, count } = await generateAnukramaniPatches();
  console.log(
    `[Patch] Generated ${count} anukramani patch(es) → ${path.relative(process.cwd(), patchFile)}`,
  );

  if (count === 0) {
    console.log("[Patch] Nothing to apply.");
    return;
  }

  await applyPatches();
}

if (import.meta.main) {
  patchRigVeda().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
