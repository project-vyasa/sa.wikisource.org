#!/usr/bin/env bun
/**
 * Facet noise audit on a built rigveda.vyview SQLite file.
 * Usage: bun run scripts/audit-facet-noise.ts [path/to/rigveda.vyview]
 */
import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";

const vyviewPath =
  process.argv[2] ??
  path.resolve("dist/rigveda/rigveda.vyview");

if (!fs.existsSync(vyviewPath)) {
  console.error(`File not found: ${vyviewPath}`);
  process.exit(1);
}

const db = new Database(vyviewPath, { readonly: true });

const digitKeyRows = db
  .query(
    `SELECT COUNT(*) AS n FROM graph_nodes n
     JOIN graph_dict d ON n.label_id = d.id
     WHERE d.value IN ('Devata', 'Rishi')
       AND n.attributes LIKE '%"value":"%_%_%'`,
  )
  .get() as { n: number };

const devataEdges = db
  .query(
    `SELECT COUNT(DISTINCT e.target_id) AS n FROM graph_edges e
     JOIN graph_dict d ON e.type_id = d.id WHERE d.value = 'DEVATA'`,
  )
  .get() as { n: number };

const chandasKti = db
  .query(
    `SELECT COUNT(*) AS n FROM graph_edges e
     JOIN graph_dict d ON e.type_id = d.id
     JOIN graph_nodes n ON e.source_id = n.id
     WHERE d.value = 'CHANDAS' AND n.attributes LIKE '%"value":"kti"%'`,
  )
  .get() as { n: number };

const chandasNonCanonical = db
  .query(
    `SELECT COUNT(*) AS n FROM graph_nodes n
     JOIN graph_dict d ON n.label_id = d.id
     WHERE d.value = 'Chandas'
       AND n.attributes NOT LIKE '%gayatri%'
       AND n.attributes NOT LIKE '%trishtubh%'
       AND n.attributes NOT LIKE '%jagati%'
       AND n.attributes NOT LIKE '%anushtubh%'
       AND n.attributes NOT LIKE '%ushnik%'
       AND n.attributes NOT LIKE '%brihati%'
       AND n.attributes NOT LIKE '%pankti%'
       AND n.attributes NOT LIKE '%nicrit%'`,
  )
  .get() as { n: number };

const totalLeaves = db
  .query(`SELECT COUNT(DISTINCT target_id) AS n FROM graph_edges`)
  .get() as { n: number };

const lines = [
  `# Facet noise audit — ${new Date().toISOString().slice(0, 10)}`,
  `vyview: ${vyviewPath}`,
  ``,
  `distinct leaf targets (graph_edges): ${totalLeaves.n}`,
  `leaves with DEVATA edge: ${devataEdges.n}`,
  `leaves without DEVATA edge: ${totalLeaves.n - devataEdges.n}`,
  `devata/rishi keys with digit patterns (rough): ${digitKeyRows.n}`,
  `chandas kti artifact keys (should be 0): ${chandasKti.n}`,
  `chandas nodes outside common canonical keys (rough): ${chandasNonCanonical.n}`,
];

const outPath = path.resolve("data/audit/facet-noise-latest.txt");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(lines.join("\n"));
console.log(`\nWrote ${outPath}`);
