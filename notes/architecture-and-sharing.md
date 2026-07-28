# Project Vyasa — Inter-Repository Architecture & Sharing Recommendations

When curating classical Vedic texts from diverse web sources (e.g., `sri-aurobindo.co.in`, `sa.wikisource.org`, `vmlt.in`, `archive.org`), each source repository acts as an independent **Publisher** within the broader Project Vyasa ecosystem. 

To prevent redundant engineering while respecting the radical structural and philological differences between these sources, we recommend a strict architectural boundary between **Source-Isolated Curation Pipelines** and **Shared Ecosystem Packages**.

---

## 1. Executive Summary & Architectural Matrix

| Component Layer | Strategy | Responsibility / Examples | Rationale |
| :--- | :--- | :--- | :--- |
| **Stage 1: Crawl & Cache**<br>*(Raw HTML / API Data)* | 🛑 **Strictly Isolated**<br>*(Per-Repository)* | `src/crawl/index.ts`<br>`data/raw/` | Every host has different URL schemes (e.g., Devanagari vs. Arabic numerals), server rate-limiting rules, and SSL certificate policies. Sharing raw crawlers creates fragile, over-complicated abstractions. |
| **Stage 2: DOM Extraction**<br>*(Cheerio / Heuristics)* | 🛑 **Strictly Isolated**<br>*(Per-Repository)* | `src/extract/index.ts`<br>`data/extracted/` | DOM structures are fundamentally different. MediaWiki markup with Sayanacharya Sanskrit commentary requires completely different parsing heuristics than custom HTML with 8 English/IAST text variants. |
| **Stage 3: Schema Specs**<br>*(Vyasa URN & Types)* | 🔄 **Shared Package**<br>`@project-vyasa/schema` | JSON Schemas, TypeScript Interfaces, URN Syntax (`urn:vyasa:*`), Container Hierarchy | Stage 3 (`transform`) output must conform to identical data structures across all publishers. A single source of truth prevents schema drift and ensures interoperability in Vyasa Viewer. |
| **Philological Utilities**<br>*(Sanskrit / Vedic Math)* | 🔄 **Shared Package**<br>`@project-vyasa/utils` | Devanagari ↔ IAST Transliteration, Vedic Accent Stripping, Metrical Syllable Counting | Linguistic transformations and mathematical validations (e.g., syllable counts for Gayatri / Trishtubh meters) are universal across Vedic texts. |
| **Stage 4 & 5: Patch & Publish CLI**<br>*(3-Way Merge & Site Builder)* | 🔄 **Shared Package**<br>`@project-vyasa/cli` | `vyasa patch`<br>`vyasa publish`<br>`vyasa verify` | Out-of-band semantic enrichment merging and GitHub Pages bundle compilation operate exclusively on standardized Vyasa JSON. Centralizing this logic eliminates maintaining identical merge algorithms across 20+ repos. |

---

## 2. What Must NEVER Be Shared (Source-Isolated Layers)

### A. Raw Crawlers & HTML Caching (`src/crawl/`, `data/raw/`)
* **Why keep isolated?**
  * **Server Courtesy Policies:** Wikimedia Foundation servers (`sa.wikisource.org`) require 1.5s delays and descriptive User-Agent headers, whereas independent sites like `sri-aurobindo.co.in` may require custom SSL bypass flags (`NODE_TLS_REJECT_UNAUTHORIZED=0`) and different backoff strategies.
  * **URL Addressing Schemes:** Wikisource addresses Suktas using Devanagari numerals (`/wiki/ऋग्वेदः_सूक्तं_१.१८५`), whereas other publishers use simple ASCII folders (`01/01-185.htm`).
  * **Data Governance:** Raw HTML archives should remain self-contained within each publisher repository for independent auditing and licensing compliance.

### B. DOM Extractors (`src/extract/`)
* **Why keep isolated?**
  * Editorial focus differs wildly between publishers:
    * `sa.wikisource.org` focuses on capturing traditional **Sayanacharya Bhashya (Sanskrit Commentary)**, **Padapatha**, and **Anukramani** metadata from complex MediaWiki `<p>` and `<pre>` tags.
    * `sri-aurobindo.co.in` focuses on capturing **8 script/accent combinations** (Samhita & Padapatha in Devanagari/IAST, accented/unaccented) plus **Sri Aurobindo's English interlinear notes** from custom CSS `<div>` classes (`samh_dev_acc`, `div_rik_1`, etc.).
  * Attempting to build a "universal Vedic HTML parser" is an anti-pattern that leads to unmaintainable spaghetti code.

---

## 3. What MUST Be Shared (Ecosystem Monorepo Packages)

We recommend creating three central packages (hosted in a shared monorepo or published to an internal NPM organization `@project-vyasa/*`) that all publisher repositories import as dev-dependencies:

### A. `@project-vyasa/schema`
Defines the canonical data types and URN specifications for Project Vyasa:
* **URN Specification:** `urn:vyasa:<publisher_id>:<corpus>:<mandala>:<sukta>:<rik>` (e.g., `urn:vyasa:sa_wikisource:rv:01:185:01`). Relative paths stay corpus-local in the AST.
* **Container Hierarchy:** Formal definitions for `Mandala` → `Anuvaka` → `Sukta` → `Rik` / `Varga` structures.
* **Validation Schemas:** Zod schemas and JSON Schemas that Stage 3 (`transform`) scripts must validate against before saving files to `vyasa-workspace/`.

### B. `@project-vyasa/utils`
A linguistic and metrical utility toolkit for Vedic Sanskrit:
* **Transliteration Engine:** Standardized wrapper around `@indic-transliteration/sanscript` to reliably convert between Devanagari and International Alphabet of Sanskrit Transliteration (IAST).
* **Accent Normalization:** `stripVedicAccents(text: string)` — removes Udatta (`॑` U+0951), Anudatta (`॒` U+0952), Svarita, and IAST combining acute/grave tones. Crucial for verifying that unaccented text matches stripped accented text.
* **Metrical & Syllable Analyzer:** Calculates syllable counts per pada and validates metrical compliance against classical Vedic meters (Gayatri = 24 syllables, Trishtubh = 44 syllables, Anushtubh = 32 syllables, Jagati = 48 syllables).

### C. `@project-vyasa/cli`
A centralized CLI engine that orchestrates pipeline stages 4 and 5 across all publisher repositories:
* **`vyasa patch` (Stage 4 - 3-Way Merge):**
  * Reads the clean base text from `vyasa-workspace/`.
  * Loads human or agent-generated semantic annotation patches (e.g., entity definitions, local URN linkings, grammatical tags) from `data/patches/`.
  * Executes a deterministic 3-way merge to apply enrichments without corrupting the base text extracted from the host.
* **`vyasa verify` (Stage 5 - Integrity Audit):**
  * Runs `@project-vyasa/utils` metrical and phonetic checks across the entire workspace.
  * Generates markdown audit reports in `data/audit/`.
* **`vyasa publish` (Stage 5 - Publication Builder):**
  * Compiles the verified workspace into an optimized, compressed static bundle (JSON/HTML) tailored for GitHub Pages deployment and immediate ingestion by the **Vyasa Viewer**.

---

## 4. Recommended Transition & Workflow

1. **Immediate Step (Dedicated Workspaces):**
   - Keep `sri-aurobindo.co.in` and `sa.wikisource.org` as separate git repositories/workspaces.
   - Each repository maintains its own local `package.json`, Bun scripts (`npm run crawl:rv`, `extract:rv`), and local caching directories.
2. **Next Milestone (Shared Package Extraction):**
   - Create a central repository (e.g., `project-vyasa/vyasa-core` or `project-vyasa/tools`).
   - Extract the Zod schemas from our transformation stubs into `@project-vyasa/schema`.
   - Implement the `stripVedicAccents` and transliteration helpers in `@project-vyasa/utils`.
   - Update `package.json` in both source repos to import these shared packages:
     ```json
     {
       "dependencies": {
         "@project-vyasa/schema": "workspace:*",
         "@project-vyasa/utils": "workspace:*",
         "cheerio": "^1.0.0"
       }
     }
     ```
