# Bundled curriculum catalog

`src/data/curriculumCatalog.ts` registers the existing TSX lesson definitions from
`src/lessons/`. The `notebook-preview` curriculum has English instruction (`en`)
and Spanish target (`es`) metadata, with Latin script (`Latn`). It is a UI-shell
fixture, not a sourced or completed Spanish curriculum.

## Lookups and ordering

```ts
import { curriculumCatalog } from '@/data/curriculumCatalog';

curriculumCatalog.getCurriculum('notebook-preview');
curriculumCatalog.getLesson('notebook-preview', 'alphabet');
curriculumCatalog.getLesson('notebook-preview', 'grammar');
curriculumCatalog.getLessons('notebook-preview'); // alphabet, then grammar
```

All lookup helpers return `undefined` for unknown IDs; callers should handle that
result rather than assuming a lesson exists. `getLessons` returns an empty array
for a known, empty curriculum, distinguishing it from an unknown curriculum.

Curricula follow registration-array order. Lessons follow the explicit
`Curriculum.lessonIds` array, **not** lesson registration order, title sorting, or
object-key iteration. The main list derives its entries from this order through
`getLessonPreviews` in `src/data/lessonPreviews.ts`. Each link uses the shared
`/lessons/[curriculumId]/[lessonId]` route; the original `/lessons/alphabet` and
`/lessons/grammar` URLs remain available as aliases.

## Adding a list entry

Author a `Lesson` in `src/lessons/`, register it with its curriculum, and add its
ID to that curriculum's `lessonIds`. No list-card component or route file needs
to be copied. Optional `Lesson.listDisplay` metadata customizes the card title,
eyebrow, summary, layout note, and length label. Without it, the card uses the
lesson title/introduction/section titles, curriculum title, and a `Preview only`
label. The two bundled lessons own their original card copy in this metadata.
Development-only fixtures should not be registered in the bundled main catalog.

## Identity scopes

- Curriculum IDs are unique across the catalog.
- Lesson IDs are unique **within a curriculum**. Different curricula may reuse
  `alphabet`; a lookup always needs both curriculum and lesson IDs.
- Section IDs are unique within their lesson; block IDs are unique within their
  section (existing lesson-authoring contracts, not catalog lookup keys).
- IDs are explicit and stable, independent of titles and positions.
- List-card keys encode the curriculum/lesson ID pair, so the same lesson ID
  in two curricula does not cause a React key collision. There is no separate
  preview-ID enumeration.

`createCurriculumCatalog` validates registration at construction and throws useful
errors naming the offending IDs for duplicate curricula, duplicate lessons within
a curriculum, duplicate ordering references, missing referenced lessons, and
registered lessons omitted from `lessonIds`. These are authoring errors; unknown
user-supplied lookup IDs simply return `undefined`. Section/block validation is
not performed by the catalog. Treat registered definitions as static bundled
content; do not mutate identities or ordering after construction.

## Checks

Run the catalog tests using Node's built-in test runner and the existing
TypeScript compiler (no additional dependencies):

```sh
node --test tests/*.test.cjs
npm run lint
npm run typecheck
```

The tests exercise the pure catalog builder and the actual bundled registration
without loading React Native or rendering lesson activities (native UI leaf
components are stubbed). They cover both preview lookups, identity scopes,
ordering, lookup misses, and invalid registrations.
