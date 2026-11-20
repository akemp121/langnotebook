# Plan 2 — Spanish curriculum research and design

## Foundation so far

The app has a reusable mobile lesson shell: ordered, scrollable lessons are defined in TSX outside the routes, registered by stable curriculum/lesson IDs, and composed from explanatory text plus configurable activity previews or custom components. It includes English-to-Spanish metadata and synthetic alphabet/grammar examples, but those are explicitly UI previews—not a researched Spanish curriculum. The structure is ready to author sourced lessons without changing the shell. Activities are still previews; functional practice, persistence, and audio/AI are later work.

## Part 1 — Materials to procure and add

Put materials under a clearly named directory such as `materials/spanish/`. Include a short `SOURCES.md` with the source URL, download date, version/edition, license or terms, and any required attribution. Keep source files unchanged; note any conversion or OCR.

### Core materials

- **FSI Basic Spanish course** — Obtain the original PDF(s), including lesson text, drills, and any indexes. If available, also provide searchable UTF-8 text or Markdown, separated by lesson and retaining page/lesson references. PDF alone is acceptable, but searchable text makes extraction and checking much faster. Confirm the edition and reuse terms.
- **Tatoeba English–Spanish sentence pairs** — Prefer the official downloadable TSV/CSV or JSONL, not copied web pages. Keep sentence IDs, language codes, text, and links/attribution information; include the dataset's license/attribution notice. If large, start with Spanish–English pairs only. Do not paraphrase or strip IDs during download.
- **Spanish word-frequency list** — Provide UTF-8 CSV/TSV with at least `rank`, `word`, and `frequency` (or count); include lemma/POS fields if supplied. Include the originating corpus, methodology, edition/date, source URL, and license. A Wiktionary list is useful, but verify that it is genuinely frequency-ranked and document what its counts represent.

### Useful supplementary references

- **Beginner proficiency/scope guide**, such as an openly reusable CEFR A1–A2 descriptor or syllabus, in PDF or searchable text, with version and rights information.
- **Spanish pronunciation and spelling reference** for questions the FSI course or syllabus leaves unclear. A link and relevant citations are sufficient; only download bulk content when the license permits it.
- Additional open sentence or lexical datasets only when their license, Spanish coverage, and provenance are clear. Avoid adding large corpora with unclear redistribution terms.

### Preferred handoff formats

- Text: UTF-8 `.txt` or `.md`; structured data: UTF-8 `.tsv`, `.csv`, or `.jsonl` with headers/schema notes.
- Scans or source publications: original `.pdf`, plus OCR/searchable text if available. Keep tables and accents/ñ intact; flag uncertain OCR rather than silently correcting it.
- Deliver as files or a ZIP preserving source names and folder structure. Include license/readme files and source metadata. No need to convert materials into app code or a database.

## Part 2 — Tentative work after materials arrive

1. **Inventory and rights check:** inspect formats, coverage, licenses, attribution requirements, and gaps; report anything unusable or needing a decision.
2. **Extract and normalize:** retain originals; create searchable text for FSI and normalized, deduplicated sentence/word tables while preserving source IDs and provenance.
3. **Evaluate evidence:** compare FSI sequencing with the proficiency guide; assess frequency-list scope and Tatoeba sentence quality, level, and translations. Exclude doubtful or unsuitable records rather than treating datasets as authoritative.
4. **Draft the curriculum map:** set beginner learning outcomes, lesson order, grammar/pronunciation progression, and high-frequency vocabulary targets. Include useful verb forms early and revisit vocabulary across lessons.
5. **Design lesson outlines:** plan notebook-style 10–15 minute lessons with clear explanations, sourced examples, and practice concepts; sequence from pronunciation and essentials to increasingly useful sentence patterns.
6. **Author and fact-check content:** draft explanations and English–Spanish examples, cite source/page or dataset IDs, check accents and regional assumptions, and mark areas where sources disagree or do not support a claim.
7. **Review coverage and usability:** check vocabulary distribution, progressive difficulty, answer/example accuracy, and mobile-sized lesson pacing; revise gaps before implementation.
8. **Deliver curriculum specification:** provide the sourced lesson map, lesson drafts, vocabulary/sentence selections, provenance notes, and unresolved questions for review. This is curriculum design only; app implementation remains the next SPEC phase.
