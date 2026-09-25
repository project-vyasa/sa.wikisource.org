# Gopatha Brāhmaṇa (`gopatha-brahmana`, CLI `:gp`)

Atharvaveda brāhmaṇa on Sanskrit Wikisource as a **single** `<poem>` dump: [गोपथब्राह्मणम्](https://sa.wikisource.org/wiki/गोपथब्राह्मणम्).

## Pipeline

| Stage | Command |
| :--- | :--- |
| Crawl | `bun run crawl:gp` |
| Extract | `bun run extract:gp` |
| Transform | `bun run transform:gp` |
| Verify | `bun run verify:gp` |
| Pack | `bun run build:gp` |

Parser: [`src/extract/parse-gopatha.ts`](../src/extract/parse-gopatha.ts) — lines `(kāṇḍa,prapāṭhaka.khaṇḍa·pada) prose`.

## Coverage caveat

The Wikisource page (probed 2026-09-24) contains **kāṇḍas 1–2 only** (~258 khaṇḍa units, 5240 pada lines). Kāṇḍas 3–6 are not in this dump; verify expects `kandas=2`.
