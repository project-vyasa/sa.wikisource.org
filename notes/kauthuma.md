# Kauthuma Sāmaveda saṃhitā (`kauthuma-samhita`)

CLI / build shorthand: **`sv`** (`crawl:sv`, `build:sv`, …).  
Catalog / workspace id: **`kauthuma-samhita`** (not `samaveda`, not `sv`).

Related: [`wikisource-works.toml`](../data/wikisource-works.toml), [`taittiriya.md`](./taittiriya.md).

---

## 1. Śākhā and what Wikisource has

| Layer | Wikisource | v1 ingest |
| :--- | :--- | :--- |
| **Kauthuma saṃhitā (accented)** | One dump page | **Yes — spine** |
| Per-daśati / per-ardha HTML pages | Under `सामवेदः/कौथुमीया/संहिता/…` | No — duplicate of dump |
| Gāna (grāma, āraṇya, ūha, ūhya, …) | Many sub-trees | **Later** — separate works or streams |
| Scan OCR (`सामवेदसंहिता भागः १`) | Noise | **Ignore** |

Do **not** allocate a catalog id `samaveda` for the whole Veda family. Jaiminīya / Rāṇāyanīya stay unallocated until a source dump exists.

---

## 2. Source of truth (accented dump)

**Page:** [सामवेदः/कौथुमीया/संहिता/सस्वरा पूर्णा](https://sa.wikisource.org/wiki/सामवेदः/कौथुमीया/संहिता/सस्वरा_पूर्णा)

| Probe (2026-09-22) | Value |
| :--- | :--- |
| Wikitext size | ~212 KB, ~2.1k lines |
| Mantra lines (`॥ n ॥` only) | **1,585** (regex probe; misses tail-only `।।n` lines) |
| **Extract (2026-09-23)** | **1,876** mantras in **26** segments (`extract:sv` / `verify:sv`) |
| Global verse index | Runs to **585** inside the file; **390** counter drops when counting all `।। n` markers |
| Pūrvārcika segments | **4** (path headers at `1.1.1.1`, `1.1.2.3`, `1.1.3.5`, `1.1.4.7` — large multi-daśati blocks) |
| Uttarārcika segments | **22** ardha units (`2.P.A` range lines) |
| TTS-style `K.P.A.M` id lines | **0** — not a Taittirīya-shaped dump |
| Tones | **Devanagari Extended** `U+A8E1` / `A8E2` / `A8E3` (~40k marks); mapped in `src/lib/vedic-pua.ts` |
| Verse markers | Two styles: `।। n ।।` and tail-only `।।n` (no closing double-danda) |
| `<pre>` wrapper | No — `<poem>` wrapper with plain wikitext |

Crawl: **one** `parse&prop=wikitext` request (same pattern as TTA/TTB single-page dumps).

---

## 3. Hierarchy in the dump (not RV, not TTS)

Two **arcika** books. **Pūrvārcika** uses a **continuous global** `।। n` counter between the four path headers (no per-daśati reset in the dump). **Uttarārcika** resets the counter at each ardha (~390 drops file-wide).

### 3.1 Pūrvārcika (छन्द आर्चिक)

Section headers are slash paths, e.g.:

```text
पूर्वार्चिकः/छन्द आर्चिकः/1.1.1 प्रथमप्रपाठकः/1.1.1.1 प्रथमा दशतिः
```

Parse the numeric tail as **`arcika.adhyaya.prapāṭhaka.daśati`** (all four numbers in the path).

| URN component | Dump source | Notes |
| :--- | :--- | :--- |
| `arcika` | `01` = pūrvārcika | Fixed `01` for this book |
| `adhyaya` | `1` in path | छन्द आर्चिक = book 1 |
| `prapāṭhaka` | `1.1.1` → third index | प्रथमप्रपाठकः |
| `daśati` | `1.1.1.1` → fourth index | प्रथमा दशतिः |
| `mantra` | `।। n` / `।।n` per block | Global index in pūrvārcika; local reset per ardha in uttarārcika |

Floaters without any `।।` marker are skipped. Parser: `src/extract/parse-sv.ts` (handles both marker styles and Devanagari digits).

### 3.2 Uttarārcika

Headers are shorter; range lines give prapāṭhaka + ardha:

```text
2.1.1 (651 - 712)
उत्तरार्चिकः/प्रथमप्रपाठकः/प्रथमोऽर्द्धः
```

| URN component | Dump source | Notes |
| :--- | :--- | :--- |
| `arcika` | `02` = uttarārcika | Leading `2` in `2.P.A` range lines |
| `adhyaya` | `2` | Uttarārcika book |
| `prapāṭhaka` | `2.P.*` middle index | प्रथमप्रपाठकः … नवमप्रपाठकः |
| `ardha` | `1` / `2` / `3` in `2.P.A` | प्रथमोऽर्द्धः, द्वितीयोऽर्द्धः, … |
| `mantra` | `॥ n ॥` | Resets each ardha |

Editor **stobha cues** in brackets — e.g. `[धा. 16 । उ ना. । स्व. 3 ।]` — are metadata, not mantra bodies. Strip or store as optional `header` on the segment; do not pack as leaves.

### 3.3 Proposed URN

```text
urn:vyasa:sa_wikisource:kauthuma-samhita:{arcika}:{prapāṭhaka}:{segment}:{mantra}
```

- `segment` = daśati (pūrvārcika) or ardha (uttarārcika). One field name in the schema; README can say “daśati / ardha”.
- Command name for leaves: **`mantra`** (same as TTS — avoids `khaṇḍa` vs `kāṇḍa` confusion).
- **`0` is not a leaf** (packer slot rule — same as Taittirīya / Aṣṭādhyāyī).

On disk (TTS-shaped paths):

```text
content/samhita/{arcika}/{prapāṭhaka}/{segment}.vy
```

`[streams.primary] path = "content/samhita"` — packed name `samhita`; no `stream.name = "primary"` sidecar.

---

## 4. Tone mapping

SV dump tones are **`U+A8E1`–`U+A8E3` (Devanagari Extended)**, not the Taittirīya Itranslator PUA set. Mapped in `src/lib/vedic-pua.ts` (`SAMAVEDA_EXTENDED`). Rare PUA `U+F131` (visarga) uses the existing PUA table.

---

## 5. Out of scope for v1

| Item | Treatment |
| :--- | :--- |
| Gāna corpora | Separate catalog rows later (`kauthuma-gramageya`, …) or streams — not in first `.vyview` |
| Global verse index `(651 - 712)` | Audit / cross-ref only; spine URNs use arcika/prapāṭhaka/segment/mantra |
| Famous sāman names (rathantara, etc.) | **Named spans** via `annotate` on parent package — same rule as Rudram on TTS |
| Paippalāda / Jaiminīya | Different recensions — different works |

---

## 6. Pipeline

```bash
bun run crawl:sv       # 1 page → data/raw/kauthuma-samhita/accented/
bun run extract:sv     # parse headers + ।। n markers
bun run transform:sv   # → content/samhita/…
bun run verify:sv
bun run build:sv       # → sa_wikisource/dist/kauthuma-samhita/
```

Closest template: **TTA** (single accented dump, one stream) + custom parser (not `parse-tts.ts`).

**Packed (2026-09-23):** `kauthuma-samhita.vyview` — 26 segments, 1,876 mantras.

---

## 7. Resolved during extract:sv

1. Floaters without `।।` — **skipped** (not merged).
2. URN levels — **`arcika` + `prapāṭhaka` + `segment`** (segment = daśati block or ardha); `adhyaya` folded into arcika `01`/`02`.
3. Single accented dump page confirmed (`सस्वरा पूर्णा` only).
