# enrich:rv — VMLT anukramani enrichment

Stage 4 of the Rig Veda pipeline. Applies **canonical** ṛṣi / devatā / chandas metadata from a private [VMLT Firebase snapshot](../reference-snapshot-001) (see [reference-snapshots.md](./reference-snapshots.md)), not from Wikisource HTML parsing.

## Design principles

| Principle | Implementation |
| :--- | :--- |
| **Graph is canonical** | `annotations/anukramani/*.vy` with `` `annotate `` spans → `graph_edges` at pack |
| **No composite sukta strings** | Mixed suktas get multiple spans; no `sukta.devata` prose blobs |
| **Compact uniform suktas** | One `` `annotate "m:s:1..m:s:n" `` span when all riks share the same tuple |
| **Vocabulary for labels** | `vocabulary/entities.vy` + `vocabulary/meters.vy` (Devanagari display) |
| **Reading view denorm** | Uniform suktas only: `sukta.rishi` / `sukta.devata` / `sukta.chandas` in content `set context` (block_attributes cache) |
| **Wikisource extract** | Text only; anukramani table cells are not used for facets after enrich |

See also [entities-and-graph-enrichment.md](./entities-and-graph-enrichment.md) for the graph model and explorer lens.

## Command

```bash
export REFERENCE_SNAPSHOTS=/path/to/reference-snapshot-001
# optional: export REFERENCE_SNAPSHOT_DATE=2026-07-29

bun run enrich:rv
```

**Prerequisites:** `extract:rv` and `transform:rv` must have run (rik counts + content `.vy` files).

## Inputs

| Input | Purpose |
| :--- | :--- |
| `data/extracted/rigveda/**/*.json` | Rik count per sukta (span bounds) |
| `sri-aurobindo.co.in/data/extracted/anukramani.json` | Per-rik `(devata, rishi, chandas)` from sukta Info pages (preferred when present) |
| `$REFERENCE_SNAPSHOTS/snapshots/vmlt-firebase/rigveda/{date}/data/{mm}/{mm}-{sss}.json` | Fallback `info.from`, `info.to`, `info.meters` |

## Outputs

| Output | Description |
| :--- | :--- |
| `data/processed/rigveda/annotations/anukramani/{mm}.vy` | Per-mandala `` `annotate `` spans (graph source of truth) |
| `data/processed/rigveda/vocabulary/entities.vy` | Ṛṣi / devatā entity keys → Devanagari labels |
| `data/processed/rigveda/vocabulary/meters.vy` | Chandas keys → Devanagari labels |
| `data/processed/rigveda/content/*/{mm}/{sss}.vy` | Uniform suktas: VMLT display labels in `set context`; mixed: anukramani keys stripped |

Generated annotation files are gitignored (like `content/`). Vocabulary and workspace config are committed when updated manually; enrich regenerates them locally on each run.

## VMLT range parsing

| Field | Typical shape | Parser |
| :--- | :--- | :--- |
| `info.from` | `madhucchandas vaiśvāmitra` | Scalar → all riks |
| `info.to` | `agni` or `1: prajāpati; 2: agni; 3-5: savitṛ` | `parseIndexedProse` |
| `info.meters` | `… triṣṭubh (1-2, 6-15); gāyatrī (3-5) …` | Prefer **2nd set of styles**; `parseMeterRanges` |

Adjacent riks with identical `(rishi, devata, chandas)` entity keys are coalesced into one URN span.

### Example (mixed sukta 1.24)

```vy
// Sukta 1:24
`annotate "1:24:1" { rishi=sunahshepa_ajigarta, devata=prajapati, chandas=trishtubh }
`annotate "1:24:2" { rishi=sunahshepa_ajigarta, devata=agni, chandas=trishtubh }
`annotate "1:24:3..1:24:5" { rishi=sunahshepa_ajigarta, devata=savitri, chandas=gayatri }
`annotate "1:24:6..1:24:15" { rishi=sunahshepa_ajigarta, devata=varuna, chandas=trishtubh }
```

### Example (uniform sukta 1.1)

```vy
// Sukta 1:1
`annotate "1:1:1..1:1:9" { rishi=madhucchandas_vaishvamitra, devata=agni, chandas=gayatri }
```

Plus `set context` in content streams with Devanagari `sukta.rishi` / `sukta.devata` / `sukta.chandas` for the reading template.

## Pipeline order

```
extract:rv → transform:rv → enrich:rv → verify:rv → build:rv
```

`transform:rv` **must** run before `enrich:rv` (creates content skeleton). Re-running `transform:rv` after `enrich:rv` resets content context (drops display labels) but does not remove `annotations/` — re-run `enrich:rv` after transform.

`patch:rv` is **deprecated** (sukta-level JSON patches into content). Use `enrich:rv` instead.

## Explorer / viewer

- **Facets (explorer):** require generic viewer support — see [feature-request-explorer-graph-facets.md](./feature-request-explorer-graph-facets.md).
- **Entity labels:** resolved from `vocabulary/entities.vy` and `vocabulary/meters.vy`.
- **Reading view:** uniform suktas show metadata via `block_attributes`; mixed suktas need graph-aware weave (future) — leaf-level display is empty in v1.

## block_attributes vs graph

Two layers serve different consumers. After `enrich:rv`, **anukramani semantics belong in the graph**; `block_attributes` keeps a shrinking role.

| Layer | Stores | Good for |
| :--- | :--- | :--- |
| **Graph** (`annotate` → `graph_edges`) | Entity key → leaf URN (`RISHI` / `DEVATA` / `CHANDAS`) | Per-rik facets (mixed suktas), normalized storage, span coalescing, future tuple / entity-lens queries |
| **block_attributes** (`set context` at pack) | Flat JSON on **container** URNs (`title`, `sukta.title`, optional `rishi`/`devata`/`chandas`) | Structural titles; reading-template weave via WASM parent walk (`{{ devata }}`) until graph-aware weave exists |

### Division of responsibility

| Concern | Source of truth (target) | Today (bridge) |
| :--- | :--- | :--- |
| Per-rik / mixed anukramani | Graph only | Graph only (explorer needs viewer ingest) |
| Uniform sukta anukramani facets | Graph + `vocabulary/entities` | Graph **and** sukta `block_attributes` (duplicate) |
| Reading template metadata | Graph + vocabulary | Uniform: `block_attributes` denorm; mixed: empty |
| Sukta / mandala titles | `block_attributes` | `block_attributes` |

### Why uniform suktas still write `sukta.*` context

`vyasav` `apply_block_attributes` walks parent URNs and merges attrs into the weave context. It does **not** yet resolve graph annotate edges per leaf. Until weave is graph-aware, enrich copies VMLT labels into content `set context` for **uniform** suktas only (~595). Mixed suktas strip those keys.

### Canonical IDs vs display labels

| Piece | Where |
| :--- | :--- |
| Facet **value id** (filter key) | Graph `attributes.value` — entity slug (`agni`) |
| Facet **value label** (sidebar) | `vocabulary/entities.vy` / `meters.vy` — Devanagari |
| Facet **type label** (“Devatā”) | `content/samhita/localization.vy` `facets` block (packed per stream); IDs in `vocabulary/facets.vy` |

Legacy `block_attributes` used Devanagari strings as facet values on uniform suktas (`इन्द्र` vs graph key `indra`). The viewer should prefer graph entity keys + vocabulary; `block_attributes` anukramani fields can be dropped once weave reads graph.

### End state for RV

1. Explorer + weave read graph annotate edges + vocabulary (no anukramani in `block_attributes`).
2. `enrich:rv` stops `applyDisplayContextForSukta` uniform branch; annotations + vocabulary only.
3. `block_attributes` retains **titles and structure** only.

See [feature-request-explorer-graph-facets.md](./feature-request-explorer-graph-facets.md) (explorer) and § Feature requests below (weave / publisher `facets.vy`).

## Facet noise audit

Post-enrich analysis on `dist/rigveda/rigveda.vyview` (2026-07-29 VMLT snapshot). Full rik count: **10,546**; riks with graph `DEVATA` edge: **9,699** (92.0%); **847** riks missing (VMLT gaps + parse failures).

| Facet | Unique keys | “Clean” rik-edges | Main noise |
| :--- | :--- | :--- | :--- |
| **devatā** | 343 | 95.4% | VMLT `info.to` indexed prose not split (~224 riks); multi-deity compounds (~137); English residue (~35) |
| **ṛṣi** | 370 | ~93% | Same indexed-prose pattern for multi-ṛṣi suktas (~16 keys); very long multi-ṛṣi strings |
| **chandas** | 32 | 98.4% canonical meters | Obscure VMLT names (`kti` 123 riks, `uparistajjyotis` 23); meter parser gaps |

**Explorer still looks noisy when:** vocabulary labels echo VMLT prose (Devanagari transliteration of `1, ३: अगस्त्य…`); entity keys with digits appear when `parseIndexedProse` fails; uniform suktas may double-count `block_attributes` + graph until viewer dedupes.

Publisher-side fixes (no viewer change): improve `parseIndexedProse` for comma/semicolon VMLT range formats; split multi-entity keys; map obscure meters to canonical chandas. Facet type registry: `vocabulary/facets.vy` + `content/samhita/localization.vy` (done). See [audit/facet-noise-2026-08-01.md](./audit/facet-noise-2026-08-01.md).

## Known limitations (v1)

- Entity keys are slugified VMLT roman (not yet crosswalked to Wikidata / internal authority files).
- Compound devatās are single entity nodes (e.g. `dyavaprithivi`).
- Per-rik reading-template metadata for mixed suktas requires viewer graph resolution or pack-time leaf `block_attributes` (not yet implemented in vyasac).

## Related

- [anukramani-audit.md](./anukramani-audit.md) — why Wikisource HTML is insufficient for facets
- [entities-and-graph-enrichment.md](./entities-and-graph-enrichment.md) — graph vs block_attributes layered model
- [feature-requests-followup.md](./feature-requests-followup.md) — handoff FRs (weave, facets.vy, parser noise)
