# Language Curriculum Workflow

## Proposed file structure

```text
materials/spanish/                 # Original PDFs/data, SOURCES.md, OCR aids
  ocr/                              # Searchable copies and extracted text

docs/curricula/spanish/             # Planning, review, and source citations
  README.md                         # Scope, status, and open decisions
  chapter-map.md                    # Agreed high-level chapter sequence
  outcomes-and-evidence.md          # To add: outcomes, evidence map, gaps
  chapters/<chapter-id>.md          # To add: detailed chapter plans
  lessons/<lesson-id>.md            # To add: lesson drafts and citations

src/lessons/spanish/                # Approved lesson content for the app
  <lesson-id>.tsx
src/data/curriculumCatalog.ts       # Register and order implemented lessons
```

Keep source materials out of the app bundle; cite selected records by source/page/sentence ID rather than copying whole datasets. Markdown is the planning/review source; approved runtime lessons use the existing bundled TSX/catalog system. No database is needed for this static curriculum. The Spanish `README.md` and `chapter-map.md` now hold the agreed high-level structure; detailed lesson content remains future work.

This is a repeatable, language-agnostic workflow for designing a curriculum from source materials through approved chapters and individual lesson plans. The current Spanish chapter proposal is recorded separately in [`docs/curricula/spanish/chapter-map.md`](docs/curricula/spanish/chapter-map.md). Curriculum design is separate from app implementation.

## Workflow

### 1. Agree on the learning context

Record the learner’s native/instruction language, target language and variety, starting level, intended outcomes, lesson length, and any learner preferences or constraints. For each language, note relevant script, pronunciation, and language-specific features without assuming another language follows the same sequence.

**Output:** a short curriculum brief and a list of decisions to confirm.

### 2. Inventory sources and provenance

List each resource, its URL/edition/date, license and attribution requirements, format, language variety, and intended use. Classify sources by role—for example, course structure, grammar reference, frequency evidence, or sentence examples. Record limitations and missing coverage; do not treat any one resource as universally authoritative.

**Output:** a source inventory and initial quality/rights notes.

### 3. Make materials usable and traceable

Preserve originals. Extract text and tables into searchable working copies; use OCR only where text extraction is inadequate. Normalize structured data without discarding original IDs, fields, accents, or provenance. Retain page numbers, lesson/unit labels, sentence IDs, and word-list ranks so every selected example or claim can be checked against its source. Record extraction errors and exclude or quarantine malformed records.

**Output:** organized working material plus a source-location scheme.

### 4. Assess and map the evidence

Review the materials for coverage, reliability, level, dialect, and quality. Map supported topics, example sentences, and vocabulary to source locations. Compare overlapping sources, note disagreements, and identify gaps. Treat frequency as prioritization evidence—not as a syllabus by itself—and screen example sentences for naturalness, level, translation quality, and rights/attribution needs.

**Output:** an evidence map, limitations, and unresolved questions.

### 5. Define outcomes and prerequisites

Translate the agreed learning context and evidence into observable learner outcomes. Identify prerequisite relationships and language-specific needs (such as writing system, pronunciation, agreement, tones, or morphology where relevant). Decide what belongs in the beginner scope and what should be deferred, with reasons tied to outcomes and evidence.

**Output:** an outcomes list and a prerequisite/coverage map.

### 6. Draft the high-level chapter map

Group outcomes into a progressive set of chapters. Check that the sequence moves from prerequisites to useful communication, balances general learning principles with target-language needs, and revisits important material rather than teaching it once. Give each proposed chapter a purpose, outcomes, prerequisites, and evidence references. Do not finalize the map until the learner has reviewed it.

**Output:** a proposed chapter map for user review—not app content.

### 7. Review and revise chapter organization

Present the map with its rationale, assumptions, and trade-offs. Collect the learner’s preferences, including priorities that differ from a conventional course order. Revise the organization and confirm scope, sequence, and any accepted deviations before drafting lesson details.

**Approval gate:** no detailed lesson authoring until the chapter map is approved.

### 8. Break approved chapters into lesson briefs

For each chapter, define lessons in sequence. Each brief states its learner outcome, prerequisites, key explanation points, target vocabulary/forms, sourced examples, expected duration, and what the learner should be able to do afterward. Target the agreed lesson length (currently 10–15 minutes for this app) and divide content into digestible steps.

**Output:** ordered lesson briefs, without UI implementation.

### 9. Design explanations and activity concepts

Write explanations for the intended learner in the instruction language, with target-language examples and plain-language notes. For each concept, choose practice that directly measures its outcome and progresses from supported recognition to useful production/retrieval. Specify prompts, expected responses, answer rationale, feedback, and any accessibility or modality needs. Reuse accurate, appropriately licensed source examples where suitable; create clearly labeled original examples when sources do not provide good practice material.

**Output:** lesson drafts with explanation text, activity specifications, and answer/feedback notes.

### 10. Verify content and source alignment

Check each factual claim, rule, translation, example, and answer against cited sources and, where sources are incomplete or conflicting, record the uncertainty or seek a suitable reference. Verify spelling, diacritics, grammar, dialect labeling, and consistency. Keep claims proportional to the evidence; do not present uncertain machine-extracted text as verified source content.

**Output:** reviewed drafts with citations and flagged items resolved or explicitly marked.

### 11. Audit the complete curriculum

Review chapter coverage and lesson progression end to end. Check prerequisite order, workload and pacing, repetition and cumulative review, frequency-informed vocabulary coverage, variety of practice, and gaps or unnecessary duplication. Confirm that language-specific needs are addressed and that the course serves the agreed outcomes rather than forcing a generic template.

**Output:** a revised curriculum specification and a record of remaining gaps.

### 12. Deliver for approval before implementation

Provide the approved chapter map, lesson briefs/drafts, activity specifications, source citations, provenance/rights notes, and open decisions as organized documents. Obtain review before moving to app content implementation. Implementation, functional activities, audio/AI, and learner-data features are separate work.

**Completion gate:** the curriculum is ready for implementation only when its scope and chapter map are approved, lesson content is source-checked, and unresolved issues are visible.

## Reuse for another language

Keep the stages, evidence map, review gates, lesson-brief fields, and audit criteria. Replace the source inventory and language-specific analysis for each target language; record the learner’s instruction language and the target variety/script explicitly. Adapt outcomes, prerequisites, examples, and practice to that language’s structure and writing system rather than copying Spanish chapter content or assuming a universal order. Preserve source-specific IDs, licensing, and citations in every curriculum.
