# Taittirīya family (Kṛṣṇa Yajurveda)

Catalog ids are full names (`taittiriya-samhita`, …). CLI suffixes are internal only: **`tts`**, **`tta`**, **`ttb`**, **`ttpr`**. Do not publish a catalog id `yajurveda` or a cryptic `tts`.

This note records the ingest investigation, answers on hierarchy/recension, GitHub size, and the layered “view into the corpus” plan (named spans, not copied fragments).

Related: [`wikisource-works.toml`](../data/wikisource-works.toml), [`ashtadhyayi.md`](./ashtadhyayi.md), [vyutils Taittirīya phonology](https://project-vyasa.github.io/vyutils/explanation/taittiriya-phonology/).

---

## 1. Yajurveda is a family, not one work

The Wikisource portal [यजुर्वेदः](https://sa.wikisource.org/wiki/यजुर्वेदः) lists **śākhās** (recensions), not a single book:

| Branch | Śākhā (examples) | What it is |
| :--- | :--- | :--- |
| **Kṛṣṇa** (“black”) Yajurveda | Taittirīya, Maitrāyaṇī, Kāṭhaka | Mantra and brāhmaṇa **intermixed** in the saṃhitā |
| **Śukla** (“white”) Yajurveda | Vājasaneyi (Mādhyandina, Kāṇva) | Mantra saṃhitā **separated** from the brāhmaṇa (Śatapatha) |

Taittirīya is the living Kṛṣṇa śākhā we are packing first. Maitrāyaṇī / Kāṭhaka / Vājasaneyi stay off the first catalog card.

### Works in this śākhā (Wikisource)

| CLI | Catalog id | Wikisource source of truth | Status |
| :--- | :--- | :--- | :--- |
| `tts` | `taittiriya-samhita` | Accented dumps [संहिता-१-४](https://sa.wikisource.org/wiki/तैत्तिरीयसंहिता-१-४) and [संहिता-५-७](https://sa.wikisource.org/wiki/तैत्तिरीयसंहिता-५-७) | **in progress** |
| `tta` | `taittiriya-aranyaka` | Accented dump [तैत्तिरीय-आरण्यकम्](https://sa.wikisource.org/wiki/तैत्तिरीय-आरण्यकम्) | **in progress** |
| `ttb` | `taittiriya-brahmana` | Accented dump [तैत्तिरीयब्राह्मणम्](https://sa.wikisource.org/wiki/तैत्तिरीयब्राह्मणम्) | **in progress** |
| `ttpr` | `taittiriya-pratisakhya` | [तैत्तरीयप्रातिशाख्यम्](https://sa.wikisource.org/wiki/तैत्तरीयप्रातिशाख्यम्) (~19k chars of sūtras) | **in progress** |

**Do not allocate** `taittiriya-upanishad` or `sri-rudram` as corpora. Those are **spans** of TTA / TTS (below).

Standalone Wikisource pages `तैत्तिरीयोपनिषदत्/{शिक्षावल्ली,…}` are an unaccented duplicate excerpt. Ignore them once TTA is packed.

---

## 2. Phonology is not in the saṃhitā body

The vyutils page is a **modern explanation of the Taittirīya-Prātiśākhya** (karaṇa/sthāna, eightfold svarita, dvitva, raṅga, nāsikya). It cites saṃhitā/āraṇyaka *examples*; it is not a chapter of the Veda.

| Text | Role |
| :--- | :--- |
| Taittirīya Saṃhitā | Accented liturgical body (exhibits TPr phenomena) |
| Taittirīya-Prātiśākhya | Recitation grammar (Vedāṅga) — separate short work |
| Śikṣāvallī (TU 1 / TA 7.2) | Upaniṣad pedagogy (`शीक्षां व्याख्यास्यामः`) — not the Prātiśākhya |

Phonology-page benchmarks that we should keep aligning against: TS 1.1.1, TS 4.5.1 (Rudram), TS 4.7.1 (Camakam), TU vallīs, TA 3.12 (Puruṣa sūkta).

Ingest the Veda as Veda; ingest TPr as its own workspace; keep the vyutils essay as documentation.

---

## 3. Hierarchy: kāṇḍa · praśna · anuvāka · mantra

Wikisource’s accented dumps number every block as **`kāṇḍa.praśna.anuvāka.mantra`** (e.g. `1.1.1.1`).

```
kāṇḍa (7)
  └─ praśna  ≡  prapāṭhaka     ← same mid-level, two names
       └─ anuvāka
            └─ mantra / khaṇḍa  ← dump’s 4th index (leaf)
```

**`0` is not a leaf.** The dump uses `K.P.0.0` for the praśna title/cue and `K.P.A.0` for the anuvāka cue (often `<…>` recitation counts). Those are headers. The packer treats index `0` as a slot (same lesson as Aṣṭādhyāyī Maheśvara), so extract drops them as mantras and keeps them only as optional titles.

### 3.1 Q01 — khaṇḍa vs mantra vs kāṇḍa

Yes: editions often call the **leaf** a **khaṇḍa** (especially in the prose/yajus stretches). The anuvāka is the recitation unit; khaṇḍas are its subdivisions. The dump’s fourth number is that unit.

We still name the URN leaf **`mantra`**:

- **kāṇḍa** (top) and **khaṇḍa** (leaf) are easy to confuse in Latin and in speech
- “mantra” matches how readers look up TS 1.1.1 / Rudram anuvākas
- the command/CSS class stays ASCII (`mantra`), which avoids the old weave panic on Devanagari class names

Notes and verify reports can say “khaṇḍa (mantra index)”.

### 3.2 Q03 — “45 prapāṭhakas”, visvara, and the four-part numbers

Three different *presentations* of the **same mid-level**:

| Wikisource presentation | What you see |
| :--- | :--- |
| **Accented dumps** (our spine) | Two `<pre>` pages. Every line-id is `K.P.A.M`. **Praśna** is the second number. |
| **Visvara** (`तैत्तिरीयसंहिता(विस्वरः)/काण्डम् N/प्रपाठकः P`) | Unaccented, word-spaced HTML, **one page per prapāṭhaka**. Prefix search listed **~45** such pages (kanda 1 had a stub `प्रपाठकः ३/` extra). Canonical TS is **44 praśnas** (8+6+5+7+7+6+5). |
| **Praśna vs prapāṭhaka** | Same container. Southern/Taittirīya usage says *praśna*; many printed and Wikisource visvara titles say *prapāṭhaka*. |

So “45 prapāṭhakas” was a **page-count of the unaccented edition**, not a fifth hierarchy level and not a different tree from `kāṇḍa.praśna.anuvāka.mantra`.

Visvara is a later optional **unaccented stream**, not the source of truth. Recitation/phonology needs the accented dumps.

URN: `urn:vyasa:sa_wikisource:taittiriya-samhita:{kanda}:{prasna}:{anuvaka}:{mantra}`

On disk: `content/samhita/{kanda}/{prasna}/{anuvaka}.vy` — `path_schema` is three levels; the leaf command is `mantra`. Same pattern as RV (`mandala/sukta.vy` + `rik`), one extra folder.

### 3.3 Q04 — Śukla vs Kṛṣṇa

**Śukla is not a spelling variant of the “Krishna” prefix.** It is the other major Yajurveda recension family:

- **Kṛṣṇa / black:** mixed saṃhitā (Taittirīya is this). Brāhmaṇa-style prose sits *inside* the saṃhitā kāṇḍas.
- **Śukla / white:** “cleaned” split — Vājasaneyi Saṃhitā is (mostly) mantra; doctrine lives in the Śatapatha Brāhmaṇa.

Layer 3 in the ingest plan (“don’t merge Śukla recensions into this publication”) means: a future `vajasneyi-samhita` is a **different work**, not an alternate stream of TTS.

---

## 4. Notable subsets: views, not copies

Śrī Rudram and the Taittirīya Upaniṣad **are** part of this family:

| Popular name | Canonical span in this dump |
| :--- | :--- |
| Śrī Rudram / Namakam / Śatarudrīya | **TTS 4.5** |
| Camakam | **TTS 4.7** |
| Śikṣāvallī (TU 1) | **TTA 5** (dump header *तैत्तिरीयोपनिषत्*) |
| Mahānārāyaṇa Upaniṣad | **TTA 6** |
| Puruṣa sūkta (Taittirīya) | **TTA 3.12** |

Andhra printed TA numbers Śikṣā/Brahmānanda/Bhṛgu as 7–9 and MNU as 10. This Wikisource dump is an 8-praśna recension: Śikṣā is praśna 5, MNU is praśna 6, Brahmānanda and Bhṛgu are **absent**. Do not invent those vallīs from unaccented standalone pages.

**Do not** clone those spans into a second `.vyview` with copied leaves. That splits URNs and diverges on re-extract.

Agreed layers:

1. **Named spans in the parent package** (do this with TTS): `annotate` ranges plus `prasna.title` on 4.5 / 4.7. Deep link `…/taittiriya-samhita/4/5`. Same mechanism as RV mixed-sukta `annotate "1:24:3..1:24:5"`.
2. **Catalog alias cards** (optional, later): library entries titled Śrī Rudram / TU that **open the parent `.vyview` at a start URN**.
3. **Separate workspaces only when the text is actually another work:** TPr, TTB, TTA, Śukla recensions. Cross-link with graph edges; do not merge into the saṃhitā stream.

---

## 5. Q02 — GitHub size: yes, this repo can hold the family

Nothing of the corpus body is committed (see root `.gitignore`): `data/raw/`, `data/extracted/`, and `data/processed/*/content/` stay local. Git tracks pipeline + workspace configs/templates, same as Rig Veda.

| Artifact | Where | Scale |
| :--- | :--- | :--- |
| TTS accented dumps | `data/raw/` (ignored) | ~850 KB wikitext (2 pages) |
| TTA dump | ignored | ~210 KB wikitext, 8 praśnas |
| TTB dump | ignored | ~600 KB wikitext, 25 praśnas (1.1–3.9) |
| TPr | ignored | ~19 KB |
| Packed `.vyview` | `gh-pages` / `sa_wikisource/dist` | TTS packed at **1.2 MB** (2026-09-12). Full family should stay a few MB. |
| GitHub repo | `main` | tooling + configs only. Tracked tree ~0.3 MB. `.git` is ~100 MB from historical Rig Veda `.vyview` blobs — do not rewrite history unless asked. GitHub hard limits: 100 MB/file, ~1 GB repo. |

RV is the size outlier (crawl time and packed viewer), and it already lives here. Adding saṃhitā + āraṇyaka + brāhmaṇa + Prātiśākhya does **not** threaten GitHub’s repo or Pages budgets as long as we keep raw/extracted/content gitignored. Optional release tarballs (like RV extracted JSON) are for contributors, not `main`.

There is **no** per-URN padapāṭha or Sāyaṇa parallel on these Wikisource pages (unlike Rig Veda). TTS is a **single samhita stream**. That keeps packed size closer to source text.

---

## 6. TTS pipeline (`bun run crawl:tts` … `build:tts`)

```bash
bun run crawl:tts       # 2 MediaWiki parse pages, 1.5s delay, skip if cached
bun run extract:tts
bun run transform:tts
bun run verify:tts
bun run build:tts       # pack + publish data/processed/taittiriya-samhita
```

Sample: `bun run src/extract/tts.ts 1.1` then `bun run src/transform/tts.ts 1.1`.

| Stage | Output |
| :--- | :--- |
| Crawl | `data/raw/taittiriya-samhita/accented/*.wikitext.json` |
| Extract | `data/extracted/taittiriya-samhita/{kanda}/{kanda}-{prasna}.json` |
| Transform | `content/samhita/{kanda}/{prasna}/{anuvaka}.vy` plus `annotations/featured.vy` |
| Verify | `data/audit/taittiriya-samhita-verify.txt` |

First extract (accented dumps, 2026-09-12): **7 kāṇḍas, 44 praśnas, 651 anuvākas, 2198 mantras**. Opening 1.1.1 is *iṣe tvorje tvā*; 4.5.1 is Namakam (*namas te rudra manyave*); 4.7.1 is Camakam (*vājaś ca me*).

Spine folder is **`content/samhita/`**. `[streams.primary] path = "content/samhita"` is the URN-spine alias; packed name is the folder. Do not emit workspace `context.vy` from transform. Do not set `stream.name = "primary"` on that folder.

Featured titles written on extract/transform:

- praśna **4.5** → श्रीरुद्रम्
- praśna **4.7** → चमकम्

---

## 7. TTA / TTB / TTPr pipelines (2026-09-20)

```bash
bun run pipeline:tta && bun run build:tta
bun run pipeline:ttb && bun run build:ttb
bun run pipeline:ttpr && bun run build:ttpr
```

Bodies stay gitignored (`data/raw/`, `data/extracted/`, `data/processed/*/content/`, `annotations/`, `sa_wikisource/dist/`).

### 7.1 TTA — 3-level `prasna:anuvaka:mantra`

Accented dump [तैत्तिरीय-आरण्यकम्](https://sa.wikisource.org/wiki/तैत्तिरीय-आरण्यकम्) is an **8-praśna** recension (not Ānandāśrama’s 10 prapāṭhakas).

| Dump | Notes |
| :--- | :--- |
| Praśnas 1–2, 4–8 | 3-part ids `P.A.M` |
| Praśna 3 | 2-part ids `A.M` between 2.19 and 4.0.0; extract promotes them to praśna 3 |
| Praśna 5 | Dump header *तैत्तिरीयोपनिषत्* — **Śikṣāvallī** (`शन्नो मित्रः` at 5.1.1). Featured `sikshavalli` as `"5:0:0"` |
| Praśna 6 | Dump header *महानारायणोपनिषत्*. Featured `mahanarayana` as `"6:0:0"` |
| 3.12 | Puruṣa sūkta (`सहस्रशीर्षा पुरुषः`). Featured `purusha_sukta` as `"3:12:0"` |

Spine: `content/samhita/{prasna}/{anuvaka}.vy`. `path_schema = ["prasna", "anuvaka"]`. First extract (2026-09-20): **8 praśnas, 217 anuvākas, 554 mantras**. Packed **392 KB**.

### 7.2 TTB — same 4-part dump as TTS

Accented dump [तैत्तिरीयब्राह्मणम्](https://sa.wikisource.org/wiki/तैत्तिरीयब्राह्मणम्): `K.P.A.M`, kāṇḍa **1.1–1.8, 2.1–2.8, 3.1–3.9**. Visvara continues 3.10–3.12 unaccented — not this source of truth. Trailing Devanagari glued to an id (`1.1.1.2१`) is stripped by the shared dump parser.

Spine: `content/samhita/{kanda}/{prasna}/{anuvaka}.vy`. First extract (2026-09-20): **3 kāṇḍas, 25 praśnas, 308 anuvākas, 1659 mantras**. Packed **836 KB**.

### 7.3 TTPr — adhyāya → sūtra

[तैत्तरीयप्रातिशाख्यम्](https://sa.wikisource.org/wiki/तैत्तरीयप्रातिशाख्यम्) (Wikisource spelling, one त): 24 `==…अध्यायः==` sections, sūtras numbered inline in Devanagari. Dump counters are noisy (`४२` for ४८, etc.); extract **splits on those numbers in source order** and assigns sequential leaf ids. `path_schema = ["adhyaya"]`, leaf command `sutra` (`s` alias). No vyākhyā stream. First extract (2026-09-20): **24 adhyāyas, 543 sūtras**. Packed **184 KB**.

Packed TTS (2026-09-12) used leaf command `mantra` (no stdlib `m`→`marker` alias). TTA/TTB do the same.

---

## 8. Viewer / display bugs (2026-09-12 spot-check)

Packed data was fine; the empty anuvākas and wrong sidebar groups were viewer bugs. Tofu and `[2]` were dump artifacts.

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Anuvāka 1.1.1 (and other 1-mantra units) blank | Viewport `LIMIT = matchingUrns.length`. Packer inserts empty `:0` html_blocks; weave then drops placeholders, so LIMIT 1 returns only the header. | `viewportLeafFetchLimit` over-fetches (`n*2+4`) in `vyasa-apps` `urn-renderer.ts`. Rebuild the viewer, not only the `.vyview`. |
| Kāṇḍa 2 sidebar lists **Anuvāka 1.2.y** | `buildSidebarItems` looked up `titles[parentPart]`. For `2:1:1`, `parentPart === "1"` collided with kāṇḍa 1. | Group by full parent/grandparent ids: `Kāṇḍa 2 (Prasna 1)`. |
| Tofu boxes, trailing `[2]` | Dump uses Sanskrit 2003 PUA (`F176` svarita, `E001`/`F156` anusvara, `F131` visarga). `[N]` is a running khaṇḍa number across the praśna. | `src/lib/vedic-pua.ts` maps PUA, strips `[N]`, drops leftover PUA, skips English “Write a description” headers. Re-extract. |
| Dotted circles in TTB 1.1.1 (and elsewhere) | After mapping PUA anusvara, Vedic anudātta/udātta sit *after* `ं`/`ः`. Noto has no glyph for that cluster, so it paints the empty-slot circle. | `reattachVedicTones` moves the tone in front of anusvara/visarga (`त्तं॒` → `त्त॒ं`). Re-extract. |
| Dotted circles remaining after reattach (2026-09-20) | Google Fonts **Noto Sans Devanagari** ships U+0951/U+0952 but not mark-to-base lookups. Every pitch mark then paints as a dotted circle, even on a normal letter (`ब्रह्म॒`). | Publisher `indic-verse.css` prefers OS Devanagari (`ITF Devanagari`, `Kohinoor Devanagari`, `Nirmala UI`, …) then Noto Serif Devanagari. Re-pack (CSS is inside the `.vyview`). |
| Yajus looks like one mashed paragraph | Leaf class is `.mantra`; publisher CSS listed `.rik` / `.sutra` only. | Add `.mantra` to `indic-verse.css`. `break_after = "।॥"` already in TTS `context.vy`. |
| Featured (Rudram / Camakam) not highlighting | Leaf ranges do not expand. Short `"4:5"` is right-aligned by `UrnEncoder` to `0:4:5`. | Annotate padded `"4:5:0:0"` / `"4:7:0:0"`. Surface is **Explore** (`attr:featured`), not the reader sidebar. |

Empty-anuvāka and sidebar fixes need a **viewer reload**. PUA, `[N]`, and featured spans need **extract → transform → pack**.

### Viewer-agent handoff (2026-09-12)

Explore FEATURED still paints **sparse non-contiguous** cells (counts **42 / 45**). That is `urnsReferToSameBlock` suffix matching (`2:1:4:5` equals container `4:5`), not a packing error. Named spans also need to be reachable from **reader / book view**.

Handoff for the vyasa-apps agent: [`vyasa-apps/notes/feature-request-named-spans-and-4level-nav.md`](../../vyasa-apps/notes/feature-request-named-spans-and-4level-nav.md) (also queued on [`WORK.md`](../../vyasa-apps/notes/WORK.md)).

