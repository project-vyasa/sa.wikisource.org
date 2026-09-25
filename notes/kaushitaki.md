# Kaushitaki Brāhmaṇa (`kaushitaki-brahmana`, CLI `:kb`)

Ṛgveda brāhmaṇa (Śāṅkhāyana / Kaushitaki) on Sanskrit Wikisource: index [`कौषीतकिब्राह्मणम्`](https://sa.wikisource.org/wiki/कौषीतकिब्राह्मणम्) with **30** `अध्यायः` subpages.

## Pipeline

| Stage | Command |
| :--- | :--- |
| Crawl | `bun run crawl:kb` |
| Extract | `bun run extract:kb` |
| Transform | `bun run transform:kb` |
| Verify | `bun run verify:kb` |
| Pack | `bun run build:kb` |

Parser: [`src/extract/parse-brahmana-prose.ts`](../src/extract/parse-brahmana-prose.ts) — section headers `A.S` (Devanagari or Arabic digits), prose body until next header.

**Extract (2026-09-24):** 30 adhyāyas, **548** sections (`data/audit/kaushitaki-brahmana-verify.txt`). `build:kb` packs to `sa_wikisource/dist/kaushitaki-brahmana/` (not yet listed in `publisher.toml` blurb).

## Coverage matrix

See [`veda-coverage-matrix.md`](./veda-coverage-matrix.md) (priority **4** after Taittirīya family, Gopatha, Pañcaviṃśa).
