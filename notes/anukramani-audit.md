# Anukramani metadata audit (Rig Veda)

Audit date: 2026-07-28. Corpus: extracted JSON (`data/extracted/rigveda/`), packed `dist/rigveda/rigveda.vyview`, reference counts from [Wikipedia Rigveda meter table](https://en.wikipedia.org/wiki/Rigveda) and [Vedic Heritage Portal](https://vedicheritage.gov.in/samhitas/rigveda/).

## Executive summary

The extract → transform → pack pipeline is **internally consistent**. Explorer facet problems come from **upstream Wikisource parsing**, not from vyview or the facet indexer (`vyasa-apps/.../facet-index.ts`).

Roughly **16% of riks** (~1,708 / 10,548) carry garbage or non-canonical `chandas` values. Rishi and devata have smaller but real gaps (12 and 14 suktas respectively). Fixing HTML heuristics alone is high-effort because Wikisource anukramani tables use many non-uniform formats (per-verse meter lists, composite suktas, prose-only metadata).

**Recommendation:** triangulate against a curated reference index (VMLT snapshot in `reference-snapshot-001`). Apply corrections via **`enrich:rv`** (graph annotations), not Wikisource HTML or sukta-level JSON patches.

---

## Corpus baseline

| Metric | Ours | Reference |
|--------|------|-----------|
| Suktas | **1,028** | 1,028 |
| Riks | **10,548** | 10,552 (Wikisource ~4 short) |
| Rishi coverage | **1,016 / 1,028** (12 missing) | ~543 distinct names in classical indices (Mayrhofer) |
| Devata coverage | **1,014 / 1,028** (14 missing) | ~200–400 distinct deity labels (varies by joint-dedication counting) |
| Chandas coverage | **1,025 / 1,028** (3 missing) | ~17 canonical meters |

### Unique values (sukta-level, extracted JSON)

| Field | Unique | Top value (sukta count) |
|-------|--------|-------------------------|
| rishi | 414 | मैत्रावरुणिर्वसिष्ठः। (94) |
| devata | 293 | इन्द्रः (203) |
| chandas | 47 | त्रिष्टुभ् (430) |

After normalizing trailing `।` and whitespace, rishi collapses to ~365 unique (**49 duplicate facet groups**).

### vyview confirmation

`block_attributes` rows: 3,114 (= 1,038 suktas × 3 streams).

| Field | Rows with value | Suktas (= rows ÷ 3) |
|-------|-----------------|---------------------|
| rishi | 3,048 | 1,016 |
| devata | 3,042 | 1,014 |
| chandas | 3,075 | 1,025 |

Distinct values in vyview: rishi 414, devata 290, chandas 45.

---

## Root cause: naive `extractAnukramaniTable()`

Location: `src/extract/parse-sukta.ts`

The parser assumes the simple form `दे. X। Y`. Wikisource often uses **per-verse meter breakdowns** or composite index prose.

### Examples

| Sukta | Raw table cell | Parsed devata | Parsed chandas | Problem |
|-------|----------------|---------------|----------------|---------|
| 1.133 | `दे. इन्द्रः । १ त्रिष्टुप्, २-४ अनुष्टुप्, ५ गायत्री…` | इन्द्रः ✓ | **१** ✗ | Verse number captured as chandas |
| 8.1 | Composite index for 34 riks | **इन्द्रः, ३०-३४ आसङ्गः** ✗ | **१-४** ✗ | Multi-rishi/devata sukta |
| 5.44 | `दे. विश्वे देवाः। जगती, १४-१५ त्रिष्टुप्` | विश्वे देवाः ✓ | जगती ✓ | rishi null; available in intro (`अवत्सारो नाम ऋषिः`) |
| 6.68 | No `दे.` table cell | null | त्रिष्टुभ् (guessed) | rishi/devata in intro only |

### Garbage chandas values (~50 suktas)

Examples: `१`, `१-३`, `१-४`, `छ.`, `षष्ठीवर्ज्यानां`, `उपरिष्टाज्ज्योतिः`.

These propagate to **~1,708 riks** in explorer (sukta metadata inherited to all leaves).

### Chandas vs Wikipedia (rik-level, sukta-attributed)

| Meter | Ours | Wikipedia ref | Delta |
|-------|------|---------------|-------|
| त्रिष्टुभ् | 4,062 | 4,253 | −191 |
| गायत्री | 2,426 | 2,451 | −25 |
| जगती | 1,333 | 1,348 | −15 |
| अनुष्टुभ् | 650 | 855 | **−205** |
| उष्णिक् | 161 | 312 | −151 |
| बृहती | 10 | 181 | **−171** |
| Other/misparsed | **1,708** | — | — |

---

## Rishi parsing: `#ws-author` only

Location: `extractRishi()` in `src/extract/parse-sukta.ts`.

**12 suktas missing rishi** (empty `#ws-author`; rishi often in Sayana intro):

`5:44`, `6:68`, `7:32`, `8:1`, `8:102`, `9:86`, `9:97`, `9:107`, `9:108`, `10:10`, `10:28`, `10:136`

---

## Devata parsing: requires `दे.` table cell

**14 suktas missing devata:**

`6:68`, `6:75`, `10:71`, `10:81`, `10:91`, `10:94`, `10:111`, `10:121`, `10:141`, `10:151`, `10:161`, `10:171`, `10:181`, `10:191`

---

## Chandas parsing: 3 suktas fully missing

`10:141`, `10:151`, `10:191`

---

## Explorer behaviour (not a bug)

- Facet counts are **per-rik** (sukta attributes propagate to all leaves via `ingestBlockAttributeFacets`).
- Example: इन्द्रः → 203 suktas, **2,047 riks** in explorer.
- Facet value IDs are lowercased; Devanagari duplicates split on trailing `।` / spacing.

---

## Source file note

`parse-sukta.ts` lines 168–174 contain a corrupted duplicate `guessChandas` where `ParseSuktaOptions` should be. Bun runs without typecheck; `tsc` would fail. Fix before parser work.

---

## Planned verification (not yet implemented)

Add to `verify:rv`:

1. Missing rishi/devata/chandas sukta lists (committed)
2. Garbage chandas detection (bare numerals, non-meter tokens)
3. Rishi normalization splits
4. Triangulation diff vs reference index (when available)

See also [verification.md](./verification.md) and [entities-and-graph-enrichment.md](./entities-and-graph-enrichment.md).

---

## Re-audit commands

```bash
# Extracted JSON counts (sukta-level)
bun -e '
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
const ROOT = "data/extracted/rigveda";
const fields = ["rishi","devata","chandas"];
const unique = Object.fromEntries(fields.map(f => [f, new Set()]));
let suktas = 0;
for (const m of readdirSync(ROOT).sort()) {
  for (const f of readdirSync(join(ROOT,m)).filter(x => x.endsWith(".json"))) {
    suktas++;
    const d = JSON.parse(readFileSync(join(ROOT,m,f),"utf8"));
    for (const field of fields) {
      const v = d.anukramani?.[field]?.trim();
      if (v) unique[field].add(v);
    }
  }
}
console.log({ suktas, unique: Object.fromEntries(fields.map(f => [f, unique[f].size])) });
'

# vyview block_attributes
sqlite3 dist/rigveda/rigveda.vyview "
  SELECT COUNT(*) total,
    SUM(json_extract(attributes,'\$.rishi') IS NOT NULL AND json_extract(attributes,'\$.rishi') != '') has_rishi
  FROM block_attributes;
"
vyasac inspect dist/rigveda/rigveda.vyview --table block_attributes --urn 01:001 --format json
```
