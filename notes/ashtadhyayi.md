# Aṣṭādhyāyī (`ashtadhyayi`) pipeline

Catalog / workspace id **`ashtadhyayi`** is allocated in [`data/wikisource-works.toml`](../data/wikisource-works.toml). Do not use `asht` or `panini`. CLI scripts keep the short suffix `:aady`.

## Source pages (download once)

| Edition | Root | Cached under |
| :--- | :--- | :--- |
| Mūla | [अष्टाध्यायी](https://sa.wikisource.org/wiki/अष्टाध्यायी) + 8 adhyāyas | `data/raw/ashtadhyayi/mula/` |
| Hindi vyākhyā | [अष्टाध्यायी हिन्दी व्याख्या सहितम्](https://sa.wikisource.org/wiki/अष्टाध्यायी_हिन्दी_व्याख्या_सहितम्) | `data/raw/ashtadhyayi/vyakhya/` |

Crawl uses the MediaWiki `parse&prop=wikitext` API (`src/lib/wikimedia.ts`), 1.5s delay, skip if cached.

```bash
bun run crawl:aady          # ~19 pages
bun run extract:aady        # iterate locally
bun run transform:aady
bun run verify:aady
bun run build:aady
```

Sample: `bun run src/extract/aady.ts 1.1` then `bun run src/transform/aady.ts 1.1`.

## Parse rules

- **Mūla:** `१.१.१ वृद्धिरादैच् ।`
- **Vyākhyā:** `[१|१|१] <sūtra> <hindi> | <udāharaṇa>` — strip aligned mūla prefix; split on first `|`.
- **Maheśvara:** 14 Śiva sūtras from mūla adhyāya 1 `==प्रत्याहार सूत्र==`, packed as adhyāya `09` pāda `01` (not `00` — packer treats 0 as a slot).
- **Spine:** mūla files live in `content/sutra/`. `[streams.primary] path = "content/sutra"` is the URN spine alias; pack uses folder name `sutra`. Do not set `stream.name = "primary"` on that folder.

## Reuse vs Rig Veda

Lifted into `src/lib/` (used by both corpora):

- `wikimedia.ts` — polite fetch, cache skip, parse API URL
- `devanagari-numerals.ts`
- `html-text.ts`
- `vy-emit.ts` (Aṣṭādhyāyī uses delimiter `A`; RV keeps `RV`)
- `danda.ts`

Stay corpus-specific: RV mandala/sukta crawl and `parse-sukta.ts`; Aṣṭādhyāyī `src/{crawl,extract,transform,schema}/aady.ts`. No VMLT enrich for Aṣṭādhyāyī.

## Counts (Wikisource canonical)

32 pādas + 14 Maheśvara sūtras. Mūla/vyākhyā ID alignment: 0 unmatched IDs on extract. A few Hindi entries have an ID but empty commentary after prefix strip (`verify:aady`).
