# Project Vyasa — Sanskrit Wikisource (विकिस्रोतः) Rig Veda Pipeline

This repository is a **Project Vyasa publisher**: it curates the **Rig Veda (ऋग्वेदः)** from [Sanskrit Wikisource](https://sa.wikisource.org) (विकिस्रोतः) and publishes a static **Vyasa** package (`catalog.json` + `.vyview`) for the viewer ecosystem.

## Attribution and thanks

The text in this publication comes from **Sanskrit Wikisource** — an open digital library maintained by **volunteers** on the Wikimedia network. The Rig Veda pages include Samhita, Padapatha, and Sayanacharya Bhashya transcribed and proofread by that community over many years.

**We are deeply thankful to every Wikisource volunteer** who contributed transcription, proofreading, commentary layout, and editorial care. This pipeline only structures and packages what they made openly available; the philological labor is theirs.

- **Source site:** [https://sa.wikisource.org](https://sa.wikisource.org)
- **License:** [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (Wikimedia content; see Wikisource for per-page details)
- **Publisher packaging:** Project Vyasa (`sa_wikisource`) — tooling and `.vyview` assembly; **not** a new edition of the Veda

If you use this publication, please credit **Sanskrit Wikisource / Wikimedia volunteers** and link to the original pages, in addition to any Project Vyasa attribution.

---

## What is in git (and what is not)

This is a **public publisher repo** with a small `main` branch and a **GitHub Pages** deployment. The full corpus is **not** stored in git — it is too large and is always recoverable from the source site or release artifacts.

| Location | Committed? | Contents |
| :--- | :--- | :--- |
| **`main`** | Yes | Pipeline code, `publisher.toml`, workspace scaffold (`vyasac.toml`, `context.vy`, templates), notes, audit summaries |
| **`main`** | No | `data/raw/` (HTML), `data/extracted/` (JSON), `content/*.vy`, `node_modules/`, local `build/` |
| **GitHub Pages** (`gh-pages`) | Deploy only | `dist/catalog.json` + `dist/rigveda/rigveda.vyview` (~19 MB) — what viewers consume |
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

**Without crawling:** download the optional **release tarball** of extracted JSON (when published), then run `transform:rv` onward.

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
| Pack | `bun run build:rv` | `dist/catalog.json`, `dist/rigveda/rigveda.vyview` |
| Deploy | `bun run deploy` | GitHub Pages |

Requires `REFERENCE_SNAPSHOTS` for enrich (see `notes/enrich-rv.md`). `patch:rv` is deprecated.

Sample commands: `bun run extract:sample`, `bun run transform:sample`.

Further reading: `notes/extract-schema.md`, `notes/variants-and-segments.md`, `notes/verification.md`, `notes/rigveda.md`, `notes/enrich-rv.md`.

---

## Architecture & code sharing

When curating classical texts across publishers (`sri-aurobindo.co.in`, `sa.wikisource.org`, etc.), **crawl and extract stay per-repo** (unique DOM and courtesy rules). Shared schemas, philological utils, and patch/publish CLI are candidates for `@project-vyasa/*` packages. See `notes/architecture-and-sharing.md`.

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

## Local viewer testing (Caddy)

This repo’s `dist/` is wired into the shared **vyasa-samples** Caddy dev server (same setup as Muktabodha Yogavasistha and Vyasa samples — avoids `sirv-cli` issues).

1. Build the publication: `bun run build:rv`
2. From `vyasa-samples/`, start Caddy:
   ```bash
   caddy run --config Caddyfile
   ```
3. In the Vyasa viewer, use local registry: `http://localhost:8080/registry.json`
   - Rig Veda catalog: `http://localhost:8080/sa_wikisource/catalog.json`

**Consumers (production):** use the live `catalog.json` from GitHub Pages after `bun run deploy`.

---

## License and attribution (summary)

| Layer | Attribution |
| :--- | :--- |
| Wikisource text | Volunteers of Sanskrit Wikisource; CC-BY-SA 4.0 |
| Sayana commentary | As presented on Wikisource |
| This repository | Project Vyasa publisher tooling; see `publisher.toml` |

Again: **thank you to the Wikisource volunteers** whose work makes this publication possible.
