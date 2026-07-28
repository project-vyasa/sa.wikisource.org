# Text Variants, Segments, and Interlinear Gloss

Design reference for what to **retain** in extract JSON vs **derive** at transform/pack time, and how **segments** relate to interlinear gloss and compiler limits.

## Variant retention policy

| Layer | Retain in extract? | Derivable? | Notes |
| :--- | :--- | :--- | :--- |
| **Samhita (accented)** | Yes | — | Canonical liturgical line; sandhi applied. |
| **Samhita (unaccented)** | No | `stripVedicAccents()` | Svara removal only; does **not** reverse sandhi. |
| **Padapatha (accented)** | Yes (preferred) | — | Canonical word list; drives segment counts. |
| **Padapatha (unaccented)** | No | `stripVedicAccents()` | Often matches Wikisource unaccented aside from spacing noise; **not** a sandhi substitute. |
| **Sayana bhashya** | Yes | — | Commentary prose; not derivable from samhita/padapatha. |
| **Interlinear gloss (`|` segments)** | Transform / patch | From padapatha + curation | See below. |

### Sandhi and human curation

Samhita–padapatha alignment depends on **sandhi** rules that are easy to get wrong in automation. Even when we generate unaccented or recomposed forms, treat **human-curated** padapatha (or a trusted reference edition) as the quality gate—not stripped accents alone.

Planned workflow:

1. Extract accented samhita + accented padapatha from Wikisource.
2. Optionally generate candidates (strip accents, sandhi expand/collapse) in transform or patch.
3. **Verify** against curated padapatha or spot-check reports before pack.

For Wikisource we minimize storage but keep layers that are **not** safely derivable (Sayana, accented canonical text). Compare `sri-aurobindo.co.in`, which retains eight script/accent variants because each layer is independently useful.

## Segments and interlinear gloss

Vyasa **interlinear gloss** (parallel streams aligned word-by-word) requires **segment markers** inside a leaf block. In source:

```vy
`v 1 [
अग्निम् | ईळे | पुरोहितम् | …
]
```

The pipe `|` is the segment separator (Vyasa User Guide — Segments).

**Padapatha** on Wikisource uses danda (`।`) between words—the same logical units we map to `|` at transform time. Until gloss streams exist, padapatha token counts are the audit proxy for per-rik segment cardinality.

### Compiler / graph-node limit

`vyasac` reserves the lower **4 bits** of the sequence ID for sub-segment addressing (~**15 segments per content block**, with reserved values for `pre` / `post`). See RFC-019 in vyasa-docs.

The verification report **p100 (max segments per rik)** informs:

- Whether any rik exceeds the 15-segment block limit (needs splitting or multi-block layout).
- Future **manifest configuration** for packing segment indices into graph-node IDs.

Utility: [`src/schema/segments.ts`](../src/schema/segments.ts).

## Related docs

- [extract-schema.md](./extract-schema.md) — Stage 2 JSON shape
- [verification.md](./verification.md) — audit reports including p100
