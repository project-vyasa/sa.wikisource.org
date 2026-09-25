# Vedāṅga Jyotiṣa (`vedanga-jyotisha`, CLI `:vj`)

[वेदाङ्गज्योतिषम्](https://sa.wikisource.org/wiki/वेदाङ्गज्योतिषम्) on Sanskrit Wikisource — single page with two sections:

| Slug | WS heading | Verses (WS 2026-09) |
| :--- | :--- | :--- |
| `archa` | आर्चज्याेतिषम् (typo on WS) | **36** (classical Ārca Jyotiṣa has 43; kāṇḍa 37–43 absent) |
| `yajusha` | याजुषज्योतिषम् | **43** |

## Pipeline

| Stage | Command |
| :--- | :--- |
| Crawl | `bun run crawl:vj` |
| Extract | `bun run extract:vj` |
| Transform | `bun run transform:vj` |
| Verify | `bun run verify:vj` |
| Pack | `bun run build:vj` |

Parser: [`src/extract/parse-vj.ts`](../src/extract/parse-vj.ts) — `॥n॥` delimiters with multiline verse bodies; duplicate verse numbers on WS are merged.

**Total on WS:** 79 verses. Audits: `data/audit/vedanga-jyotisha-verify.txt`.
