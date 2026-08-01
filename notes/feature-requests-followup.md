# Feature requests — post graph-facet ingest

Handoff text for agents working in `vyasa-apps`, `vyasa`/`vyasav`, and `sa.wikisource.org`.  
Prerequisite: explorer graph facet ingest (see [feature-request-explorer-graph-facets.md](./feature-request-explorer-graph-facets.md)) — assumed done or in progress.

Test package: `sa.wikisource.org/dist/rigveda/rigveda.vyview` via `http://localhost:8080/sa_wikisource/catalog.json`.

---

## FR-2 — Viewer: graph-aware weave for template variables

**Repo:** `vyasa` (`vyasav`) + `vyasa-apps` (if loader passes graph to weave)

**Problem:** `reading.vy` uses `{{ devata }}`, `{{ rishi }}`, `{{ chandas }}`. WASM `apply_block_attributes` merges **parent container** `block_attributes` only. Mixed suktas (~431) have no sukta-level anukramani in context; per-rik values exist only in graph edges.

**Request:**

1. At weave time for each leaf URN, resolve declared template keys from **graph annotate edges** on that leaf (`DEVATA` → `devata`, etc.), using `attributes.value` as entity key.
2. Resolve display strings via packed `vocabulary` (same lookup as explorer facet labels).
3. Fall back to parent `block_attributes` when no graph edge (titles, legacy pubs).
4. Schema-neutral: key list from manifest `template_context_keys` or packed `vocabulary/facets` — no hard-coded `devata` in Rust.

**Acceptance:**

- Sukta **1.24** rik 2 reading view shows अग्निः (or vocabulary label for `agni`), not blank.
- Sukta **1.1** still works without sukta-level denorm once publisher removes `sukta.devata` from context.
- BG publications unchanged.

**Enables publisher:** remove uniform `applyDisplayContextForSukta` branch from `enrich:rv`.

---

## FR-3 — Publisher: `vocabulary/facets.vy` + stop anukramani denorm

**Repo:** `sa.wikisource.org`

**Status:** Registry + localization **done** (2026-08-01). Uniform sukta denorm removal still pending FR-2.

**Problem:** Facet type names and block-attribute allow-list should be publisher-declared, not viewer-hard-coded.

**Request:**

1. ~~Emit `data/processed/rigveda/vocabulary/facets.vy`~~ **Done** — vyasa-bg pattern:

   ```vy
   // vocabulary/facets.vy — canonical IDs
   `facets {
       "devata" = "devata",
       "rishi" = "rishi",
       "chandas" = "chandas"
   }
   ```

   ```vy
   // content/samhita/localization.vy — Devanagari display
   `facets {
       "devata" = "देवता",
       "rishi" = "ऋषि",
       "chandas" = "छन्दस्"
   }
   ```

   `enrich:rv` regenerates `vocabulary/facets.vy` on each run; localization is hand-maintained.

2. After FR-2 ships, remove uniform sukta `sukta.rishi` / `sukta.devata` / `sukta.chandas` from `apply-display-context.ts` (annotations + vocabulary only).

3. Optional: request vyasac manifest emission `facet_attributes = ["rishi","devata","chandas"]` for any remaining `block_attributes` indexing during transition.

**Acceptance:** Rebuild vyview; explorer type labels in Devanagari; no anukramani keys in `block_attributes` except titles.

---

## FR-4 — Publisher: VMLT range parser hardening (facet noise)

**Repo:** `sa.wikisource.org` (`src/lib/vmlt-ranges.ts`, `entity-registry.ts`)

**Problem:** Inspected vyview (2026-07-29 snapshot) — see [enrich-rv.md](./enrich-rv.md) § Facet noise audit. ~5% devatā / ~10% ṛṣi rik-edges still noisy.

**Root causes:**

| Pattern | Example | ~Riks affected |
| :--- | :--- | :--- |
| `info.to` / `info.from` comma-indexed prose not parsed | `1, २: अगस्त्य; ३, ५: लोपमुद्रा` → key `1_2_4_agastya_3_5_6_lopamudra` | ~224 devatā, ~103 ṛṣi |
| Multi-entity per range left as one slug | `visvedevas_1_2_5_9_11_12_agni` | ~137 devatā |
| VMLT `or` alternates | `vimada_aindra_or_vimada_prajapatya_or_…` | ~610 ṛṣi |
| Obscure meter names | `kti` (123 riks), `uparistajjyotis` (23) | ~152 chandas |
| English residue in VMLT | `kesins_long_haired_ones_i_e_agni_surya_vayu` | ~35 devatā |
| Missing VMLT / incomplete parse | — | 847 riks no `DEVATA` edge |

**Request:**

1. Extend `parseIndexedProse` for VMLT formats: comma-separated indices (`1, २`), Devanagari digits, `and` / `or` clause boundaries.
2. When a range lists multiple deities, emit **separate annotate spans** or **split entity keys** (policy: one primary devatā per rik for facets, or `COMPOUND_OF` graph edges — document choice).
**Fix (FR-4):** add `ṅ` to `METER_CHUNK_RE` in `vmlt-ranges.ts` (root cause of most `kti` keys). See [facet-noise-2026-08-01.md](../notes/audit/facet-noise-2026-08-01.md) § What is `kti`?.
4. Add `data/audit/facet-noise-latest.txt` script (sqlite queries on built vyview) for regression tracking.

**Acceptance:** Re-run enrich + build; digit-containing entity keys &lt; 5; chandas non-canonical &lt; 0.5%; document remaining 847 riks without VMLT.

---

## FR-5 — vyasac (optional): manifest `facet_attributes`

**Repo:** `vyasa` (`vyasac`)

**Problem:** Viewer should not guess which `block_attributes` keys are facets.

**Request:** Pack declared facet keys from workspace config into `manifest` (e.g. `facet_attributes` JSON array). Viewer reads manifest; removes need for publisher-specific suffix rules.

**Low priority** if graph ingest covers all anukramani and denorm is removed.

**Publisher decision (2026-08-01):** Hold FR-5 assuming the three sukta-level anukramani `block_attributes` (`rishi`, `devata`, `chandas`) are deprecated after FR-2 (graph weave) and uniform denorm is dropped from `enrich:rv`. Manifest `facet_attributes` is only needed if block-attribute facet indexing remains for those keys.

---

## Suggested order

1. **FR-1** — graph facet ingest (viewer) — *in flight*
2. **FR-3** — `facets.vy` (publisher, small) — *registry done; denorm drop after FR-2*
3. **FR-4** — parser noise (publisher)
4. **FR-2** — graph weave (viewer/vyasav)
5. **FR-3** completion — drop denorm
6. **FR-5** — optional manifest cleanup
