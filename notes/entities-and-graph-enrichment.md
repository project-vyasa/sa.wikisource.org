# Entities, graph enrichment, and anukramani annotations (Rig Veda)

Guidance for modeling ṛṣi, devatā, and chandas so Rig Veda publications support **semantic exploration** in Project Vyasa (explorer entity lenses, layered frames, graph queries on SQLite) without sacrificing fast display facets.

Related: [architecture-and-sharing.md](./architecture-and-sharing.md), [extract-schema.md](./extract-schema.md), [rigveda.md](./rigveda.md).

---

## 1. Problem: attributes vs entities

### What block attributes give us today

The transform emits sukta-level context keys such as `sukta.title`, `sukta.rishi`, `sukta.chandas`, `sukta.devata`. At pack time, vyasac copies `sukta.*` into **block_attributes** on the sukta container sequence id.

That is good for:

- Explorer card titles (“Sukta 1:185” instead of “Node 1:185”)
- Simple SQL facets (filter by raw string)
- Book-view chrome without a graph hop

### What attributes alone lose

If ṛṣi and devatā remain **only** as container attributes:

- No “explore Agni across mandalas” **entity hub**
- No multi-hop queries (ṛṣi → suktas → riks → streams)
- Facets are **string equality** on surface Sanskrit, not a shared ontology
- Harder to align with layered frames and cross-corpus links later

### Recommendation: layered model

**Do not choose attributes *or* entities.**

| Layer | Role | Source |
| :--- | :--- | :--- |
| **Denormalized attributes** | Fast index, display, basic facets | `sukta.*` in `set context` → `block_attributes` |
| **Graph enrichment** | Semantic search, relationship explorer, layered frames | `annotations/` + `vocabulary/entities.vy` → `graph_nodes` / `graph_edges` |

Attributes **index**; entities **relate**.

---

## 2. How Bhagavad Gita models entities (reference pattern)

In `vyasa-bg`:

1. **Entity commands** — `command-def { category="entity" }` for Krishna, Sanjaya, etc.
2. **Event frames** — e.g. `sanjaya.uvaca` wrapping verse ranges (who speaks)
3. **Annotation overlay** — `annotations/speakers.vy` binds events to URN spans
4. **Graph at pack** — vyasac `graph.rs` projects:
   - Entity node → `PARTICIPATES_IN` → Event node → `ANCHOR` → verse URN (integer)
   - Optional `IN_FRAME` for ritual/editorial layers

Explorer-style queries are SQL CTEs over `graph_edges` joined to `html_blocks` on URN integers (see `vyasac/tests/graph_enrichment_test.rs`).

---

## 3. Rig Veda: different relation shape

| Bhagavad Gita | Rig Veda (anukramani) |
| :--- | :--- |
| **Speaker** — who utters this block | **Ṛṣi** — seer / composer (draṣṭṛ) |
| Changes often within a chapter | Usually **sukta-level**; rik-level overrides possible |
| Discrete cast (Krishna, Sanjaya) | Devatā surface strings vary (`अग्निः`, `द्यावापृथिव्यौ`) |
| Narrative **events** | **Taxonomic** links (deity, meter, seer) |

BG’s `uvaca` event model is the right **mechanism**; Rig Veda semantics are closer to **enrichment relations**:

- `(rik)` —`SEER`→ `(madhuchchhanda)`
- `(rik)` —`DEVATA`→ `(agni)` or `(dyavaprithivi)`
- `(rik)` —`HAS_CHANDAS`→ `(gayatri)` — meter as class/entity, not a “person”

Chandas is best modeled as a **meter entity or type**, not the same node kind as Agni or a ṛṣi.

---

## 4. Entity normalization

Wikisource gives **surface strings** (`अगस्त्यो मैत्रावरुणिः`, `द्यावापृथिव्यौ`). Graph identity needs:

1. **Canonical key** — e.g. `agastya_maitravaruni`, `dyavaprithivi`, `agni`
2. **Display label** — raw Devanagari in `vocabulary/entities.vy`
3. **Optional** — IAST, English, Wikisource author link (later)

Pipeline approach:

- Start with a growing registry + **unknown entity** nodes (raw text in node attributes)
- Transform maps known strings to keys; unknown keys become stable hashes of normalized text
- Refine registry over time without re-breaking URN anchors

---

## 5. Explorer lenses (structural vs semantic)

Two complementary views on the same `.vyview` SQLite pack:

| Lens | Source | Example |
| :--- | :--- | :--- |
| **Structure** | `catalog_tree` + leaf blocks | Mandala → Sukta → rik grid |
| **Entity** | `graph_edges` | All riks where devatā = `agni` |
| **Layered frame** | `IN_FRAME` edges | Riks inside an “anukramani” or stream frame |

Graph queries layer on SQL: CTE over `graph_edges` → join `html_blocks` on `sequence_id` (URN int). Same substrate as BG speaker queries.

---

## 6. Implementation sequence

1. **Done** — `enrich:rv` emits `annotations/anukramani/` + `vocabulary/{entities,meters}.vy` from VMLT snapshot (see [enrich-rv.md](./enrich-rv.md)).
2. **Done** — Transform no longer writes Wikisource `sukta.rishi` / `sukta.devata` / `sukta.chandas` into content context.
3. **Later** — Generic viewer facet ingestion from graph `annotate` edges (not publication-specific hooks in `vyasa-apps`).
4. **Now** — Uniform suktas: denormalized `sukta.*` display labels in content context (reading template).
5. **Later** — Mixed-sukta reading view via graph-aware weave; leaf `block_attributes` at pack; entity authority crosswalk.

---

## 7. Workspace additions (sketch)

### 7.1 `context.vy` — commands and aliases

```vy
`command-def { name="anukramani", category="event", flexible_args="true" }
`command-def { name="annotate", category="metadata", flexible_args="true" }

`set settings {
  event_header.subject_key = "rishi"
}

`alias-def { name="rik.anukramani", target="anukramani", params="action=anukramani" }
```

Using `category="event"` for `anukramani` matches BG’s event → `ANCHOR` → rik pattern. Alternatively use plain `annotate { devata=..., rishi=..., chandas=... }` without an event wrapper (see §8.2).

### 7.2 `vocabulary/entities.vy` — canonical keys

```vy
`entities {
    "agni" = "अग्निः"
    "dyavaprithivi" = "द्यावापृथिव्यौ"
    "madhuchchhanda" = "मधुच्छन्दा वैश्वामित्रः"
    "agastya_maitravaruni" = "अगस्त्यो मैत्रावरुणिः"
}

`entities {
    "gayatri" = "गायत्री"
    "trishtubh" = "त्रिष्टुभ्"
}
```

Second block can live in `vocabulary/meters.vy` if we split **person/deity** vs **meter** vocabularies.

### 7.3 Entity command defs (for graph node labels)

```vy
`command-def { name="agni", category="entity" }
`command-def { name="madhuchchhanda", category="entity" }
`command-def { name="gayatri", category="entity" }
```

Or register entities only via vocabulary + alias-def to `entity` with params (BG style).

---

## 8. Annotation file shapes

Annotations live under `data/processed/rigveda/annotations/` and are merged at pack time (same as `vyasa-bg/annotations/speakers.vy`).

URN spans use **relative** paths matching the workspace hierarchy: `mandala:sukta:rik` with `..` ranges (vyasac expands `1:1:1..1:1:9`).

### 8.1 Generated file layout

Option A — **one file per mandala** (easier for transform, smaller diffs):

```text
annotations/
  anukramani/
    01.vy
    02.vy
    ...
```

Option B — **single generated file** for simpler first pass:

```text
annotations/anukramani.vy
```

### 8.2 Pattern A — event frame (BG-aligned)

Sukta 1.1 — nine riks, one ṛṣi/devatā/chandas:

```vy
`title [Rig Veda Mandala 1 — Anukramani]

`annotate "1:1:1..1:1:9" [
    `[[ rik.anukramani { rishi=madhuchchhanda, devata=agni, chandas=gayatri } ]] rik.anukramani
]
```

Graph projection (conceptual):

```text
madhuchchhanda (Entity) --PARTICIPATES_IN--> rik.anukramani (Event) --ANCHOR--> 1:1:1 … 1:1:9
```

Event attributes `devata`, `chandas` become additional edges or event node attributes depending on enricher rules.

### 8.3 Pattern B — direct relation edges via `annotate` attributes

vyasac’s `annotate` handler also creates typed edges from attribute keys (see `annotation_overlay_test.rs`):

```vy
`annotate "1:185:1..1:185:11" { rishi=agastya_maitravaruni, devata=dyavaprithivi, chandas=trishtubh }
```

This yields graph edges with types derived from keys (`RISHI`, `DEVATA`, `CHANDAS`) from value nodes to each rik URN in the span—without an explicit event node.

**Trade-off:** Pattern A is better for “one anukramani frame” UI layers (`IN_FRAME`). Pattern B is simpler to generate and matches attribute keys directly.

### 8.4 Sukta-level annotate + rik expansion

When metadata is sukta-uniform, annotate the **sukta container** span (all riks in sukta):

```vy
`annotate "1:185:1..1:185:11" { rishi=agastya_maitravaruni, devata=dyavaprithivi, chandas=trishtubh }
```

Transform knows rik count from extracted JSON; URN third component is **rik** (not `verse`).

### 8.5 Layered frame (future)

Wrap anukramani in a named frame for explorer “layers”:

```vy
`frame { id="anukramani-1-185", type="anukramani", name="Sukta 1:185" } [
    `annotate "1:185:1..1:185:11" { rishi=agastya_maitravaruni, devata=dyavaprithivi, chandas=trishtubh } [
        `[[ rik.anukramani ]] rik.anukramani
    ]
]
```

`IN_FRAME` edges connect the frame node to inner event/annotation nodes.

### 8.6 Rik-level override (when meter or devatā changes mid-sukta)

```vy
`annotate "1:72:1..1:72:5" { rishi=..., devata=..., chandas=gayatri }
`annotate "1:72:6..1:72:10" { rishi=..., devata=..., chandas=trishtubh }
```

Emit only when extracted data differs from sukta default.

---

## 9. Transform emission (implemented as `enrich:rv`)

Implemented in `src/enrich/` — not in transform. See [enrich-rv.md](./enrich-rv.md).

Pseudocode (matches production):

```typescript
function entityKey(raw: string, registry: Map<string, string>): string {
  // registry: normalized Devanagari → canonical key
  return registry.get(normalize(raw)) ?? slugFromRaw(raw);
}

function emitAnukramaniBlock(sukta: ExtractedSukta): string {
  const m = Number(sukta.mandala);
  const s = Number(sukta.sukta);
  const n = sukta.riks.length;
  const span = `${m}:${s}:1..${m}:${s}:${n}`;
  const rishi = entityKey(sukta.anukramani.rishi ?? "", RISHI_REGISTRY);
  const devata = entityKey(sukta.anukramani.devata ?? "", DEVATA_REGISTRY);
  const chandas = entityKey(sukta.anukramani.chandas ?? "", CHANDAS_REGISTRY);
  return `\`annotate "${span}" { rishi=${rishi}, devata=${devata}, chandas=${chandas} }\n`;
}
```

Keep **parallel** `sukta.*` display labels in content `set context` for **uniform suktas only** (reading template / block_attributes denorm). Mixed suktas use graph edges for explorer facets.

---

## 10. Example SQL (explorer entity lens)

Find all rik sequence ids for devatā `agni` (after graph pack):

```sql
WITH devata_nodes AS (
  SELECT n.id
  FROM graph_nodes n
  JOIN graph_dict d ON n.label_id = d.id
  WHERE d.value = 'Devata'  -- or key-derived label from annotate
    AND json_extract(n.attributes, '$.value') = 'agni'
),
rik_urns AS (
  SELECT e.target_id AS seq_id
  FROM graph_edges e
  JOIN graph_dict d ON e.type_id = d.id
  WHERE d.value = 'DEVATA'
    AND e.source_id IN (SELECT id FROM devata_nodes)
)
SELECT h.sequence_id, s.name AS stream, h.content
FROM html_blocks h
JOIN streams s ON h.stream_id = s.id
WHERE h.sequence_id IN (SELECT seq_id FROM rik_urns);
```

Exact edge labels depend on chosen annotation pattern (§8.2 vs §8.3); adjust CTE to match pack output.

---

## 11. Open questions

- **Compound devatā** — one node (`dyavaprithivi`) vs split (`dyaus` + `prithivi`) with `COMPOUND_OF` edges?
- **Same ṛṣi, many orthographies** — registry maintenance vs automatic fuzzy match?
- **Chandas as entity vs enum** — `HAS_CHANDAS` to meter node vs attribute on rik?
- **Per-rik anukramani** — Wikisource rarely gives rik-level table rows; Sayana intro may differ—defer until source evidence exists.

---

## 12. Summary

| Concern | Approach |
| :--- | :--- |
| Explorer facets / entity queries | `annotations/anukramani/` → graph (`enrich:rv`) |
| Reading template (uniform suktas) | `sukta.*` in content context (temporary denorm) → graph + vocabulary when weave is graph-aware |
| Wikisource anukramani cells | Extract only; not used for facets after enrich |
| Container titles / structure | `block_attributes` from `set context` (long-term) |
| BG parity | `annotate` attribute edges (Pattern B, §8.3) |
| Sequencing | extract → transform → **enrich** → verify → pack |

### block_attributes vs graph (see also [enrich-rv.md](./enrich-rv.md) § block_attributes vs graph)

- **Graph** — canonical for leaf-level anukramani (entity key → rik URN).
- **block_attributes** — container display props (`title`, `sukta.title`); optional temporary denorm of uniform sukta anukramani for weave until `vyasav` resolves graph per leaf.
- **Vocabulary** — entity keys → Devanagari labels; `facets.vy` → facet type names (देवता, ऋषि).
- **Do not** treat duplicated anukramani in `block_attributes` as long-term architecture.
