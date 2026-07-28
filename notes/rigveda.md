# Rig Veda — Sanskrit Wikisource Collection Notes

## 1. Source Profile & Philological Features

The Rig Veda collection on [Sanskrit Wikisource](https://sa.wikisource.org) represents a classical Devanagari textual tradition. Unlike modern English-centric editions, Wikisource embeds traditional Vedic commentaries and morphological parsing directly into the text hierarchy.

### Key Textual Layers Present
1. **Samhita Text (ऋग्वेदसंहिता):** The primary liturgical verses in Devanagari script. Depending on the specific Mandala and proofreading status, verses may appear with full Vedic accents (*svara* marks: Udatta, Anudatta, Svarita) or in plain unaccented Devanagari.
2. **Padapatha (पदपाठः):** The word-by-word morphological division of each verse, separated by danda (`।`). Essential for linguistic validation and syllable counting.
3. **Sayanacharya Bhashya (सायणाचार्य भाष्य):** The classical 14th-century Sanskrit commentary by Sayana. In Wikisource, Sayanacharya's commentary often precedes each verse or sukta with an introductory paragraph specifying the traditional **Anukramani** metadata:
   - **Rishi (ऋषिः / द्रष्टा):** The seer who revealed the hymn (e.g., Agastya Maitravaruni for Sukta 1.185).
   - **Devata (देवता):** The deity addressed (e.g., Dyavaprithivi for Sukta 1.185).
   - **Chandas (छन्दः):** The poetic meter (e.g., Trishtubh, Gayatri, Anushtubh).

---

## 2. Technical Architecture & URL Patterns

### URL Scheme
- **Base Domain:** `https://sa.wikisource.org`
- **Mandala Index Pages:** `/wiki/ऋग्वेदः_मण्डल_१` through `/wiki/ऋग्वेदः_मण्डल_१०`
  - URL-encoded example (Mandala 1): `https://sa.wikisource.org/wiki/%E0%A4%8B%E0%A4%97%E0%A5%8D%E0%A4%B5%E0%A5%87%E0%A4%A6%E0%A4%83_%E0%A4%AE%E0%A4%A3%E0%A5%8D%E0%A4%A1%E0%A4%B2_%E0%A5%A7`
- **Sukta Pages:** `/wiki/ऋग्वेदः_सूक्तं_<mandala>.<sukta>` (e.g., `/wiki/ऋग्वेदः_सूक्तं_१.१८५`)
  - Notice that Mandala and Sukta numbers in the URL use **Devanagari numerals** (`० १ २ ३ ४ ५ ६ ७ ८ ९`) or standard Arabic numerals depending on redirects. Our crawler must normalize and resolve both numeral formats.

### DOM Structure (MediaWiki)
- Content is wrapped inside `<div class="mw-content-ltr mw-parser-output">`.
- Verse structures and Sayana commentary paragraphs (`<p>`) are interspersed with `<pre>` blocks or customized wiki-templates.
- Extraction scripts must apply heuristic DOM filtering to distinguish between Samhita verses, Padapatha word lists, and commentary prose.

---

## 3. Crawling & Server Courtesy Requirements

Because Sanskrit Wikisource is hosted by the Wikimedia Foundation, we must strictly adhere to Wikimedia's automated scraping policies:
1. **Descriptive User-Agent:** Every request must include a custom User-Agent string identifying the project, bot name, and contact/maintainer URL:
   `User-Agent: ProjectVyasa-Bot/1.0 (+https://github.com/project-vyasa; contact@project-vyasa.org)`
2. **Rate Limiting:** Maximum concurrency of 1 request at a time (`CONCURRENT_LIMIT = 1`), with a minimum delay of **1,500ms (1.5 seconds)** between successive HTTP calls.
3. **Local Filesystem Caching:** All fetched HTML pages must be stored in `data/raw/rigveda/<mandala>/<sukta>.html`. Before initiating an HTTP request, the crawler must check if a valid, non-empty local file exists and skip downloading if cached.
4. **SSL/TLS Validation:** Unlike independent sites with self-signed or expired certificates, Wikimedia servers present valid certificates. No insecure SSL flags (`-k` or `NODE_TLS_REJECT_UNAUTHORIZED=0`) should be used.

---

## 4. Pipeline Execution Goals

1. **Stage 1 (`src/crawl/index.ts`):** Enumerate links from all 10 Mandala index pages and cache all 1,028 Suktas locally.
2. **Stage 2 (`src/extract/index.ts`):** Extract JSON with `mandala`, `sukta`, `rik`, accented `samhita_devanagari`, accented `padapatha_devanagari`, and `sayanacharya_bhashya`. Retain accented canonical text; derive unaccented via `stripVedicAccents()` only. Sandhi-aware samhita↔padapatha alignment may require human-curated reference for QA even if we generate candidates later. See [variants-and-segments.md](./variants-and-segments.md).
3. **Stage 3 (`src/transform/index.ts`):** Convert extracted data into the Vyasa workspace; emit `|` segment markers in padapatha bodies for future interlinear gloss streams.
4. **Stage 4 (`src/patch/index.ts`):** Enable out-of-band human and agent corrections via 3-way merge without altering raw extracted files.
5. **Stage 5 (`src/verify/index.ts`):** Audit verse integrity, **p100 (max) segments per rik** for graph-node ID packing, missing layers, and (planned) meter/sandhi checks. See [verification.md](./verification.md).

---

## 5. Ecosystem Alignment & Code Sharing

To maintain clean separation across multiple source repositories in Project Vyasa while maximizing code reusability:
- **Shared Libraries (Recommended Monorepo Packages):**
  - `@project-vyasa/schema`: Vyasa URN specification and JSON/XML validation schemas.
  - `@project-vyasa/utils`: Devanagari ↔ IAST transliteration wrappers, Vedic accent stripping, and metrical syllable calculators.
  - `@project-vyasa/cli`: Shared CLI engines for executing Stage 4 (`patch`) and Stage 5 (`verify` / static site generation).
- **Repo-Specific Implementations:**
  - `src/crawl/` and `src/extract/` remain strictly isolated within `sa.wikisource.org`, customized to Wikimedia DOM quirks and Devanagari numeral parsing.
