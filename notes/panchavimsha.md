# Pañcaviṃśa Brāhmaṇa (`panchavimsha-brahmana`, CLI `:pv`)

Sāmaveda brāhmaṇa: index [पञ्चविंशब्राह्मणम्](https://sa.wikisource.org/wiki/पञ्चविंशब्राह्मणम्) with **25** `अध्यायः` subpages.

## Pipeline

| Stage | Command |
| :--- | :--- |
| Crawl | `bun run crawl:pv` |
| Extract | `bun run extract:pv` |
| Transform | `bun run transform:pv` |
| Verify | `bun run verify:pv` |
| Pack | `bun run build:pv` |

Parser: shared [`parse-brahmana-prose.ts`](../src/extract/parse-brahmana-prose.ts) (Arabic `A.S` headers).

**Extract (2026-09-24):** 25 adhyāyas, **372** sections.
