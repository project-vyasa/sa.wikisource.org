# Feature request: Generic graph-backed explorer facets

**For:** `vyasa-apps` (viewer) and optionally `vyasa` / `vyasav` (annotation query)  
**Triggered by:** `sa.wikisource.org` `enrich:rv` — Rig Veda anukramani now lives in the **graph** (`annotate` spans), not Wikisource `block_attributes`.  
**Consumer test package:** `sa.wikisource.org/sa_wikisource/dist/rigveda/rigveda.vyview` (ETEB build with `enrich:rv`).

---

## Problem

Explorer facets are inaccurate or absent for Rig Veda after `enrich:rv`:

| Sukta type | Count (approx) | Facets today | Should be |
|------------|----------------|--------------|-----------|
| **Uniform** | ~595 | Ṛṣi / devatā / chandas via sukta-level `block_attributes` (works) | Same, but prefer graph as source of truth |
| **Mixed** | ~431 | **No** anukramani facets (sukta attrs stripped) | Per-rik facets from graph edges |

Packed data is correct (~9,699 `RISHI` / `DEVATA` / `CHANDAS` graph edges per rik). The viewer never loads or indexes them.

**Root cause:** explorer facet ingestion is hard-coded for Bhagavad Gita patterns (`Action` → speaker) and a **publication-specific allow-list** of block-attribute keys (`rishi`, `devata`, `chandas`). It does not consume the generic `annotate { key=entity_id }` graph projection that vyasac already emits.

---

## Current data path (what works vs what doesn’t)

### Packer (`vyasac`) — no change required for v1

`annotations/anukramani/*.vy` lines like:

```vy
`annotate "1:24:3..1:24:5" { rishi=sunahsepa_ajigarti, devata=savitri, chandas=gayatri }
```

`vyasac/src/graph.rs` (`annotate` handler) writes:

- **Node** per attribute value: `label_id` = `Rishi` / `Devata` / `Chandas` (capitalized key), `attributes` = `{"value":"savitri"}` (entity key string)
- **Edge** per target leaf URN: `source_id` = value node, `target_id` = encoded rik URN, `type_id` = `RISHI` / `DEVATA` / `CHANDAS`

Verified in `sa_wikisource/dist/rigveda/rigveda.vyview` (SQLite).

### Viewer load path — **broken for annotate facets**

`vyasa-apps/.../publication-loader.ts` loads annotations via WASM `build_annotations_query()`:

```sql
-- vyasav/src/wasm.rs build_annotations_query()
WHERE d.value IN ('Action', 'Note', 'Event', 'Attribute')
```

**`Rishi` / `Devata` / `Chandas` nodes are excluded.** They never appear in `packageData.annotations`.

### Facet index — **BG-specific + RV hardcoding**

`vyasa-apps/apps/platform/src/lib/explore/facet-index.ts`:

| Location | Issue |
|----------|--------|
| L49 | `ATTRIBUTE_FACET_KEYS = {'rishi','chandas','devata','deity','meter'}` — **Rig Veda field names baked into generic viewer** |
| L105–123 `ingestAnnotationFacets` | Only `label === 'Action'` (speaker) and `label === 'Attribute'` |
| L126–147 `ingestBlockAttributeFacets` | Allow-list above **plus** RV suffix rules L137–140: `.endsWith('.rishi')`, `.chandas`, `.devata` |
| L112–116 | Speaker facet: `Action` + `attributes.speaker` — **BG-specific** |
| L323, L338–339 | `speaker` type label resolution — **BG-specific** |
| L332–345 `labelForFacetValue` | Resolves `speaker` via `entities` vocabulary; **does not** resolve `attr:*` values via vocabulary |

`facet-index.test.ts` L138–154 encodes the RV `block_attributes` propagation case — keep as regression test, but implementation must not require RV-only constants in production code.

---

## Required behavior (acceptance criteria)

Using `sa.wikisource.org/sa_wikisource/dist` served at `http://localhost:8080/sa_wikisource/` (vyasa-samples Caddy):

1. **Mixed sukta 1.24** — explorer shows per-rik devatā facets (e.g. rik 1 = prajāpati, rik 2 = agni, riks 3–5 = savitr, 6–15 = varuna). Filtering rik 2 by devatā highlights only that rik.
2. **Uniform sukta 1.1** — all 9 riks share one devatā / ṛṣi / chandas facet value; counts = 9.
3. **Facet value labels** — sidebar shows **Devanagari** from `vocabulary/entities.vy` and `vocabulary/meters.vy`, not raw slug keys (`agni` → `अग्निः`).
4. **No publication-specific constants** in `facet-index.ts` for RV (remove `rishi`/`devata`/`chandas` from a hard-coded set). BG speaker support must also be generalized or isolated behind the same mechanism.
5. **Precedence / dedup** — when both graph edge and sukta-level `block_attributes` exist (uniform suktas), index once per leaf; prefer **graph entity key** as canonical `valueId`, vocabulary for display label.
6. **Tests** in `facet-index.test.ts` + annotation loader tests using **synthetic** graph rows (not RV corpus names in production constants).

---

## Recommended design (viewer-first)

### A. Extend annotation loading (vyasav + publication-loader)

**Option A1 (preferred):** Generalize `build_annotations_query()` to return all graph edges where the source node is an annotation value node linked to a leaf URN — not a fixed label allow-list.

Example shape (conceptual):

```sql
SELECT e.target_id AS urn_int,
       edge_dict.value AS edge_type,      -- RISHI | DEVATA | CHANDAS | ...
       n.attributes AS attributes
FROM graph_edges e
JOIN graph_nodes n ON e.source_id = n.id
JOIN graph_dict edge_dict ON e.type_id = edge_dict.id
WHERE edge_dict.value = UPPER(node_label)  -- edge type matches annotate attr key
```

Or: return edges where `e.type_id` is not `ANCHOR` / `PARTICIPATES_IN` / `IN_FRAME` / `HAS_NOTE`, and `attributes` contains `{"value": "..."}`.

**Option A2 (minimal):** Add `Rishi`, `Devata`, `Chandas` to the existing `WHERE d.value IN (...)` list.  
Works for RV but **does not** fix the architectural leak; only do this as a stepping stone.

Update `AnnotationEntry` typing if needed: today `{ urn, label, attributes }` uses `label` as node type; for annotate edges, use `edge_type` + `attributes.value` as entity key.

### B. Generalize facet ingestion (`facet-index.ts`)

Replace publication-specific allow-lists with a **declarative facet model**:

| Mechanism | BG speaker | RV anukramani | Future |
|-----------|------------|---------------|--------|
| Graph edge type → facet type | `PARTICIPATES_IN` + Action node OR keep `Action`+`speaker` as legacy | `RISHI`→`attr:rishi`, `DEVATA`→`attr:devata`, `CHANDAS`→`attr:chandas` | Any `annotate` attr key |
| Value ID | entity key (`krishna`) | entity key (`agni`) | entity key |
| Display label | `vocabulary/entities` | `vocabulary/entities` + `vocabulary/meters` | vocabulary |

**Cleanup targets (must fix):**

```typescript
// REMOVE or replace with manifest-driven config:
const ATTRIBUTE_FACET_KEYS = new Set(['rishi', 'chandas', 'devata', 'deity', 'meter']);

// REMOVE RV suffix special-casing:
!keyLower.endsWith('.rishi') && !keyLower.endsWith('.chandas') && !keyLower.endsWith('.devata')
```

**Replace with one of:**

1. **Manifest table** in vyview (`manifest.facet_attributes` JSON) — publisher declares facet keys; or  
2. **Vocabulary category** `facets` in workspace (`vocabulary/facets.vy`) packed into `vocabulary` table; or  
3. **Generic rule:** ingest any `block_attributes` key except structural (`title`, `id`, `mandala`, `sukta`, …) **and** any graph annotate edge type that matches a packed vocabulary facet declaration.

**Speaker generalization:** treat `speaker` as one facet type id (`attr:speaker` or `speaker`) driven by the same graph-ingest path as `RISHI`/`DEVATA`, not a separate `Action` branch. BG `annotations/speakers.vy` may need to remain compatible during migration.

### C. Label resolution

In `labelForFacetValue`, for any `attr:*` facet whose `valueId` is an entity key:

```typescript
resolveEntityLabel(vocabulary, valueId, primaryStream)
```

Chandas keys live in `vocabulary/meters.vy` (category `entities` in pack) — ensure `getVocabularyLabel` finds them.

For **legacy** `block_attributes` facets that used Devanagari as `valueId`, normalize: if value matches a vocabulary label, use entity key as `valueId` (or accept both during transition).

### D. URN matching

Leaf URNs from `catalog_tree` are unpadded (`1:24:3`). Graph annotate targets use the same (`1:24:3..1:24:5`). `urnCoversLeaf` / `urnsReferToSameBlock` already handle this — verify with RV vyview (no packer change expected).

---

## Alternative: packer materialization (not preferred)

`vyasac` could **derive leaf-level `block_attributes`** from graph edges at pack time for declared facet keys.

| Pros | Cons |
|------|------|
| Explorer works without viewer changes | Duplicates graph; publication-specific facet keys in packer unless manifest-driven |
| Reading template `{{ devata }}` works for mixed suktas | Violates “graph is canonical” for enrich:rv |

If pursued, must be **manifest-driven** (`[facets] attributes = ["rishi","devata","chandas"]`) and schema-neutral in Rust (no hard-coded `devata`). Viewer changes still needed for entity-key labels unless block_attributes store Devanagari.

**Recommendation:** implement **viewer graph ingest** (sections A–C). Optional pack-time denorm later for weave templates only.

---

## Files to touch

| Repo | File | Change |
|------|------|--------|
| `vyasa` | `vyasav/src/wasm.rs` | Generalize `build_annotations_query()` |
| `vyasa-apps` | `apps/platform/src/lib/viewer/publication-loader.ts` | Map new annotation rows → `AnnotationEntry` |
| `vyasa-apps` | `apps/platform/src/lib/explore/facet-index.ts` | Remove RV/BG hardcoding; generic graph + optional manifest facets |
| `vyasa-apps` | `apps/platform/src/lib/explore/facet-index.test.ts` | Graph annotate tests; move RV case behind fixture data not constants |
| `sa.wikisource.org` | (optional) `vocabulary/facets.vy` | Declare `rishi`, `devata`, `chandas` facet types for manifest-driven ingest |

---

## Test plan

1. Build RV: `cd sa.wikisource.org && REFERENCE_SNAPSHOTS=... bun run enrich:rv && bun run build:rv`
2. Serve: `cd vyasa-samples && caddy run` → catalog `http://localhost:8080/sa_wikisource/catalog.json`
3. **1.24** — devatā facet shows ≥4 distinct values; rik-level filter works
4. **1.1** — single devatā value, count 9
5. **BG regression** — `vyasa-bg` speaker facets still work after speaker generalization
6. Unit: mock `annotations: [{ urn: '1:24:2', label: 'Devata', attributes: { value: 'agni' } }]` → `attr:devata|agni` on leaf `1:24:2`

---

## Out of scope (separate FR)

- Reading-template weave: `{{ devata }}` on mixed suktas (needs graph resolution in `vyasav` `apply_block_attributes` or template helper)
- Tuple queries (“riks where devatā=agni AND chandas=gayatri”) — entity lens / SQL CTE UI
- Packer leaf `block_attributes` materialization

---

## References

- Publisher enrich design: [enrich-rv.md](./enrich-rv.md)
- Graph model: [entities-and-graph-enrichment.md](./entities-and-graph-enrichment.md) §8.3
- vyasac annotate projection: `vyasa/vyasac/src/graph.rs` (`cmd == "annotate"`)
- Current broken loader filter: `vyasav/src/wasm.rs` `build_annotations_query()`
