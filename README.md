# Project Vyasa — Sanskrit Wikisource (विकिस्रोतः) publisher

This repository is a **Project Vyasa publisher**: it curates Sanskrit texts from [Sanskrit Wikisource](https://sa.wikisource.org) (विकिस्रोतः) and publishes static **Vyasa** packages (`catalog.json` + `.vyview`) for the viewer ecosystem.

Works in this publisher (ids in [`data/wikisource-works.toml`](data/wikisource-works.toml)):

| Id | Work | Status |
| :--- | :--- | :--- |
| `rigveda` | Rig Veda (ऋग्वेदः) | published |
| `ashtadhyayi` | Aṣṭādhyāyī (अष्टाध्यायी) | in progress |
| `taittiriya-samhita` | Taittirīya Saṃhitā (तैत्तिरीयसंहिता) | in progress |

## Attribution and thanks

The text in this publication comes from **Sanskrit Wikisource** — an open digital library maintained by **volunteers** on the Wikimedia network. The Rig Veda pages include Samhita, Padapatha, and Sayanacharya Bhashya transcribed and proofread by that community over many years.

**We are deeply thankful to every Wikisource volunteer** who contributed transcription, proofreading, commentary layout, and editorial care. This pipeline only structures and packages what they made openly available; the philological labor is theirs.

- **Source site:** [https://sa.wikisource.org](https://sa.wikisource.org)
- **License:** [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (Wikimedia content; see Wikisource for per-page details)
- **Publisher packaging:** Project Vyasa (`sa_wikisource`) — tooling and `.vyview` assembly; **not** a new edition of the source texts

If you use this publication, please credit **Sanskrit Wikisource / Wikimedia volunteers** and link to the original pages, in addition to any Project Vyasa attribution.

---

## What is in git (and what is not)

This is a **public publisher repo** with a small `main` branch and a **GitHub Pages** deployment. The full corpus is **not** stored in git — it is too large and is always recoverable from the source site or release artifacts.

| Location | Committed? | Contents |
| :--- | :--- | :--- |
| **`main`** | Yes | Pipeline code, `sa_wikisource/` (`publisher.toml`, shared `styles/`), workspace scaffold (`vyasac.toml`, `context.vy`, templates), notes, audit summaries |
| **`main`** | No | `data/raw/` (HTML), `data/extracted/` (JSON), `content/*.vy`, `node_modules/`, local `build/` |
| **GitHub Pages** (`gh-pages`) | Deploy only | `sa_wikisource/dist/catalog.json` + `.vyview` files — what viewers consume |
| **GitHub Release** (optional) | Artifact | e.g. `rigveda-extracted.tar.zst` — avoids re-crawling Wikimedia for contributors |

**Rebuild the corpus locally:**

```bash
bun install
export REFERENCE_SNAPSHOTS=/path/to/reference-snapshot-001  # required for enrich:rv
bun run crawl:rv      # polite fetch from sa.wikisource.org (~30 min, idempotent)
bun run extract:rv
bun run transform:rv
bun run enrich:rv
bun run verify:rv
bun run build:rv      # vyasac pack + publish → dist/
bun run deploy        # push dist/ to GitHub Pages
```

Aṣṭādhyāyī (`ashtadhyayi`) does not need `REFERENCE_SNAPSHOTS`:

```bash
bun run crawl:aady      # ~19 pages, idempotent
bun run extract:aady
bun run transform:aady
bun run verify:aady
bun run build:aady
```

**Aṣṭādhyāyī** details: [`notes/ashtadhyayi.md`](notes/ashtadhyayi.md).

Taittirīya Saṃhitā (`taittiriya-samhita`, CLI `:tts`) is a single accented-samhita stream (no padapāṭha/Sāyaṇa on Wikisource). Family plan (āraṇyaka, brāhmaṇa, Prātiśākhya): [`notes/taittiriya.md`](notes/taittiriya.md).

```bash
bun run crawl:tts       # 2 dump pages, idempotent
bun run extract:tts
bun run transform:tts
bun run verify:tts
bun run build:tts
```

**Without crawling Rig Veda:** download the optional **release tarball** of extracted JSON (when published), then run `transform:rv` onward.

Canonical source remains **Sanskrit Wikisource**. We crawl politely (1 request at a time, 1.5s delay, descriptive User-Agent) and cache HTML only on your machine under `data/raw/`.

---

## Objectives & scope

Sanskrit Wikisource provides a rich **Devanagari textual tradition**:

1. **Samhita (ऋग्वेदसंहिता)** — liturgical verses (often with Vedic svara marks)
2. **Padapatha (पदपाठः)** — word-by-word division
3. **Sayanacharya Bhashya (सायणाचार्य भाष्य)** — classical Sanskrit commentary

We extract these three layers into structured Vyasa streams, enrich anukramani from a private VMLT snapshot (`enrich:rv`), and publish a static package — **without** burdening Wikimedia servers unnecessarily.

---

## 5-stage pipeline

```
[sa.wikisource.org] ──(1. Crawl)──> [data/raw/] ──(2. Extract)──> [data/extracted/]
                                                                       │
[GitHub Pages]      <──(5. Verify + pack)── [data/processed/] <──(3. Transform)─┘
        ↑                                              ↑
        │                                    (4. Enrich — VMLT anukramani)
```

| Stage | Command | Output |
| :--- | :--- | :--- |
| 1 Crawl | `bun run crawl:rv` | `data/raw/rigveda/**/*.html` (local only) |
| 2 Extract | `bun run extract:rv` | `data/extracted/rigveda/**/*.json` (local only) |
| 3 Transform | `bun run transform:rv` | `data/processed/rigveda/content/**/*.vy` (local only) |
| 4 Enrich | `bun run enrich:rv` | `annotations/anukramani/`, `vocabulary/{entities,meters}.vy` |
| 5 Verify | `bun run verify:rv` | `data/audit/rigveda-segments-latest.txt` |
| Pack | `bun run build:rv` / `bun run build:aady` / `bun run build:tts` | `sa_wikisource/dist/catalog.json`, `.vyview` files |
| Deploy | `bun run deploy` | GitHub Pages |

Requires `REFERENCE_SNAPSHOTS` for enrich (see `notes/enrich-rv.md`). `patch:rv` is deprecated.

Sample commands: `bun run extract:sample`, `bun run transform:sample`.

Further reading: `notes/extract-schema.md`, `notes/variants-and-segments.md`, `notes/verification.md`, `notes/rigveda.md`, `notes/enrich-rv.md`.

---

## Architecture & code sharing

When curating classical texts across publishers (`sri-aurobindo.co.in`, `sa.wikisource.org`, etc.), **crawl URL schemes and DOM parsers stay per-corpus**. Host-level helpers (polite Wikimedia fetch, Devanagari numerals, `.vy` emission) live in `src/lib/` and are shared by Rig Veda, Aṣṭādhyāyī, and Taittirīya Saṃhitā. See `notes/architecture-and-sharing.md`, `notes/ashtadhyayi.md`, and `notes/taittiriya.md`.

---

## Quickstart

```bash
bun install

# Full corpus (after crawl or release tarball)
bun run extract:rv
bun run transform:rv
bun run enrich:rv
bun run verify:rv
bun run build:rv

# Publish to GitHub Pages (requires gh-pages CLI + permissions)
bun run deploy
```

## Publisher catalog (`sa_wikisource/`)

Same layout as `vyasa-samples/vysamples/`: catalog identity lives in a folder named after `[publisher] identifier`, not at the repo root (pipeline `src/`, `notes/`, and `data/` stay siblings).

- `sa_wikisource/publisher.toml` — publisher identity
- `sa_wikisource/styles/` — shared `publisher_css` (workspaces set `[publish] publisher_dir = "../../../sa_wikisource"`)
- `sa_wikisource/dist/` — `vyasac publish` output (`catalog.json` + `.vyview`); deployed by `bun run deploy`
- `sa_wikisource/Caddyfile` and `local-registry.json` — local catalog server (not deployed)

## Local development (Caddy)

Serve this publisher’s catalog locally (single-repo workflow):

```bash
caddy run --config sa_wikisource/Caddyfile
```

In the viewer Settings → Catalog Sources:
- **Custom Registries:** `http://localhost:9100/registry.json`
- **Custom Catalogs:** `http://localhost:9100/sa_wikisource/catalog.json`

Open publications with `?catalog=http://localhost:9100/sa_wikisource/catalog.json`.

**Consumers (production):** use the live `catalog.json` from GitHub Pages after `bun run deploy`.

---

## License and attribution (summary)

| Layer | Attribution |
| :--- | :--- |
| Wikisource text | Volunteers of Sanskrit Wikisource; CC-BY-SA 4.0 |
| Sayana commentary | As presented on Wikisource |
| This repository | Project Vyasa publisher tooling; see `sa_wikisource/publisher.toml` |

Again: **thank you to the Wikisource volunteers** whose work makes this publication possible.
