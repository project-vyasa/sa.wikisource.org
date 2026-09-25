# Veda & Vedāṅga coverage matrix

Reference taxonomy: [India.org 0004 — Canonical Knowledge Taxonomy](file:///Users/anand/Projects/india-org-site/india.org/notes/0004-canonical-knowledge-taxonomy-and-linkage-matrix.md).

Registry: [`data/wikisource-works.toml`](../data/wikisource-works.toml).  
**Status legend:** `published` | `in_progress` | `planned` | `reserved` | `—` (not on sa.wikisource.org at probed title).

Last probe of sa.wikisource.org page existence: 2026-09-24 (HTTP / parse API).

---

## 1. Four Vedas × four strata (Śruti)

| Veda / śākhā | Saṃhitā | Brāhmaṇa | Āraṇyaka | Upaniṣad | Publisher notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ṛgveda** (Śākala) | `rigveda` **published** | `kaushitaki-brahmana` **in_progress** (30 adhyāyas, 548 sections) | — (WS ✗ Aitareya) | — (standalone pages partial) | RV padapāṭha + Sāyaṇa are editorial streams, not strata. |
| **Kṛṣṇa Yajurveda** (Taittirīya) | `taittiriya-samhita` **published** | `taittiriya-brahmana` **published** | `taittiriya-aranyaka` **published** | Partial in TTA (Śikṣāvallī, Mahānārāyaṇa); TU 2–3 absent in WS dump | TPr **published**; see `notes/taittiriya.md`. |
| **Śukla Yajurveda** (Vājasaneyi) | — (WS ✗ VS saṃhitā title) | `shatapatha-brahmana` **planned** (WS ✓) | In Śatapatha | `isha-upanishad` etc. **planned** (WS ✓ Īśā) | Separate catalog from Taittirīya. |
| **Sāmaveda** (Kauthuma) | `kauthuma-samhita` **published** | `panchavimsha-brahmana` **in_progress** (25 adhyāyas, 372 sections) | — | — (Kena etc. separate) | Gāna corpora **later** (`notes/kauthuma.md`). |
| **Atharvaveda** (Śaunaka) | `atharvaveda-saunaka` **published** | `gopatha-brahmana` **in_progress** (WS kāṇḍas 1–2 only, 5240 padas) | (in brāhmaṇa) | — (Mundaka etc. **planned**) | |

---

## 2. Six Vedāṅgas

| Vedāṅga | Foundational text | Catalog id | WS (probed) | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Śikṣā** | Pāṇinīya Śikṣā | `paniniya-siksa` | ✓ | **planned** |
| | Ṛgveda Prātiśākhya | `rigveda-pratisakhya` | ✓ | **planned** |
| | Taittirīya Prātiśākhya | `taittiriya-pratisakhya` | ✓ | **published** |
| **Chandas** | Piṅgala / छन्दःशास्त्रम् | `chandas-shastra` | ✓ (large) | **planned** |
| **Vyākaraṇa** | Aṣṭādhyāyī | `ashtadhyayi` | ✓ | **in_progress** |
| | Dhātu / Gaṇa pāṭha | `dhatupatha`, `ganapatha` | reserved | **reserved** |
| **Nirukta** | Yāska | `nirukta` | ✓ (index → subworks) | **planned** |
| **Jyotiṣa** | Vedāṅga Jyotiṣa | `vedanga-jyotisha` | ✓ | **planned** |
| **Kalpa** | Śrauta / Gṛhya / Dharma / Śulba | `apastamba-grhya`, `gautama-dharma`, `baudhayana-sulba` | partial ✓ | **planned** |

---

## 3. Implementation priority (this repo)

| Order | Work | CLI | Rationale |
| :---: | :--- | :--- | :--- |
| 1 | Taittirīya family (TTS, TTA, TTB, TPr) | `:tts` `:tta` `:ttb` `:ttpr` | Multi-stratum Kṛṣṇa Yajur — **published**. |
| 2 | `gopatha-brahmana` | `:gp` | AV brāhmaṇa; single WS page. |
| 3 | `panchavimsha-brahmana` | `:pv` | SV brāhmaṇa; 25 adhyāya subpages. |
| 4 | `kaushitaki-brahmana` | `:kb` | ṚV brāhmaṇa; 30 adhyāya subpages. |
| 5 | `nirukta`, `vedanga-jyotisha`, `chandas-shastra` | `:nk` `:vj` `:ch` | Vedāṅga band. |
| 6 | `paniniya-siksa`, `rigveda-pratisakhya` | `:ps` `:rvpr` | Pair with Aṣṭādhyāyī / Śikṣā. |
| 7 | Kalpa sūtras (sample) | `:agr` etc. | One gṛhya + one dharma + one śulba. |
| 8 | `shatapatha-brahmana`, Upaniṣad standalones | `:sb` | Śukla Yajur spine. |

---

## 4. Cross-links

- Kauthuma: [`notes/kauthuma.md`](./kauthuma.md)
- Atharvaveda: [`notes/atharvaveda.md`](./atharvaveda.md)
- Gopatha: [`notes/gopatha.md`](./gopatha.md)
- Pañcaviṃśa: [`notes/panchavimsha.md`](./panchavimsha.md)
- Kaushitaki: [`notes/kaushitaki.md`](./kaushitaki.md)
- Taittirīya: [`notes/taittiriya.md`](./taittiriya.md)
- Aṣṭādhyāyī: [`notes/ashtadhyayi.md`](./ashtadhyayi.md)
