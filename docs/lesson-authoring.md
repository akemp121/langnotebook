# Authoring bundled lessons

Lessons are static TypeScript/TSX, not route files or database records. Add content
and registration only: do **not** copy a screen, edit `LessonLayout`, or add
exercise-specific renderer branches. Current activities are disabled UI previews,
not working practice, audio, AI, scoring, or progress tracking.

## 1. Write a lesson

Put learner-facing definitions in `src/lessons/*.tsx` (with supporting components
outside `src/app/`). Types live in `src/types/curriculum.ts`. For example, create
`src/lessons/patterns.tsx` with this complete, synthetic example:

```tsx
import { AppText } from '@/components/AppText';
import { ClassificationPracticePreview } from '@/components/ClassificationPracticePreview';
import type { Lesson } from '@/types/curriculum';

// A custom component can take any props; no activity registry is required.
function PatternStrip({ label }: { label: string }) {
  return <AppText accessibilityLabel={`Synthetic pattern: ${label}`}>{label}</AppText>;
}

export const patternsLesson: Lesson = {
  id: 'patterns',
  title: 'Synthetic patterns',
  introduction: ['Invented examples for layout only, not language instruction.'],
  sections: [
    {
      id: 'pattern-overview',
      title: 'Compare patterns',
      blocks: [
        { id: 'before-strip', kind: 'text', paragraphs: ['Compare these invented shapes.'] },
        {
          id: 'pattern-strip',
          kind: 'activity',
          withCard: false,
          children: <PatternStrip label="A → B → A" />,
        },
        { id: 'after-strip', kind: 'text', paragraphs: ['Now look at the static choices.'] },
        {
          id: 'pattern-choices',
          kind: 'activity',
          eyebrow: 'Static preview',
          title: 'Example categories',
          children: (
            <ClassificationPracticePreview
              questionNumber={1}
              totalQuestions={1}
              prompt="Synthetic pattern A–B–A"
              instruction="Preview only; answers are not checked."
              choices={[
                { id: 'repeated', label: 'Repeated' },
                { id: 'different', label: 'All different' },
                { id: 'unsure', label: 'Unsure' },
              ]}
            />
          ),
        },
      ],
    },
  ],
};
```

Sections and blocks render in array order in one continuous scroll. Text blocks
contain plain paragraph strings (not Markdown). Activity `children` accept any
`ReactNode`, including your own component. Omit `withCard` (or use `true`) for the
default `ActivityCard` padding, border, and optional `eyebrow`/`title`. With
`withCard: false`, only the children render: card padding, border, and card heading
metadata are absent. Your component owns any framing and headings; normal notebook
spacing between blocks remains. Keep custom content mobile-sized and accessible,
and avoid nested scrolling or screen/navigation wrappers.

See `src/fixtures/StaticToneGraphic.tsx` and `src/fixtures/toneCurriculum.tsx` for a
larger custom graphic between paragraphs with no renderer changes.

## 2. Register and order it

For the example above, edit `src/data/curriculumCatalog.ts`:

1. Import `patternsLesson` from `../lessons/patterns`.
2. Add `'patterns'` at the desired position in `previewCurriculum.lessonIds`, e.g.
   `['alphabet', 'patterns', 'grammar']`.
3. Add `patternsLesson` to `previewRegistration.lessons`. Registration-array order
   does not order lessons; **`lessonIds` does**. Every registered lesson must be
   referenced exactly once there.

That shared registration already feeds both catalogs. The home list discovers the
lesson automatically, and `/lessons/notebook-preview/patterns` opens it through
`src/app/lessons/[curriculumId]/[lessonId].tsx` and `src/screens/LessonScreen.tsx`.
No new route, list card, or renderer code is needed. The original alphabet/grammar
URLs are compatibility aliases, not templates for new lessons.

For a **new curriculum**, define a `CurriculumRegistration` (see
`src/data/createCurriculumCatalog.ts`) containing `{ curriculum, lessons }`. Its
`curriculum` needs `id`, `title`, `instructionLanguage`, `targetLanguage`, and
ordered `lessonIds`. Add the registration to **both** `lessonListCatalog` (home
list) and `curriculumCatalog` (route lookup). Curricula appear in each catalog's
registration-array order. For route-only synthetic/development fixtures, use
`src/fixtures/` and register only in `curriculumCatalog`, like
`syntheticToneRegistration`; this is bundled content, not a development-build gate.
See the [fixture walkthrough](fixtures/tone-composition.md).

Optional `Lesson.listDisplay` customizes the home card. If provided, supply all
five fields: `title`, `eyebrow`, `summary`, `layoutNote`, `estimatedLength`.
Otherwise, the list derives copy from lesson/curriculum metadata and uses a
`Preview only` length label. See [catalog details](curriculum-catalog.md) for
lookup and validation behavior.

## 3. Use stable IDs

- Curriculum IDs: unique across a catalog. Lesson IDs: unique within a curriculum.
- Section IDs: unique within a lesson. Block IDs: unique within a section.
- Choice IDs, dialogue turn IDs, and letter IDs: unique within their respective
  arrays; example-word IDs: unique within their letter's examples.
- Use explicit, stable lowercase kebab-case slugs such as `pattern-overview`
  (a convention, not an enforced format). Curriculum/lesson IDs appear in URLs;
  avoid spaces, slashes, and changing IDs when editing titles or reordering.
  Do not derive IDs from array positions, translated labels, or speaker names.

The catalog rejects duplicate curriculum/lesson IDs, duplicate lesson references,
missing references, and registered lessons absent from `lessonIds` at construction.
It does not validate section/block/activity-data IDs or language tags; authors own
those checks. Unknown route IDs show the shared missing-lesson fallback.

## 4. Supply preview props from the lesson

Import previews from `src/components/`. All listed props are required, arrays are
readonly-compatible, and the components do not load curriculum fixtures for you:

| Component | Props / data shape |
| --- | --- |
| `AlphabetPreview` | `letters`: `{ id, letter, pronunciationHint, examples: [{ id, label }] }[]` |
| `ClassificationPracticePreview` | `questionNumber`, `totalQuestions` (numbers); `prompt`, `instruction` (strings); `choices: { id, label }[]` (any number of categories) |
| `ConversationPracticePreview` | `questionNumber`, `totalQuestions`, `instruction`; `languageContext: { targetLanguage, translationLanguage }` (human-readable names for accessibility labels); `turns: { id, speaker, targetText, translation }[]` |

All data fields other than the counters are strings or the indicated arrays/objects.
Counters are displayed values, not navigation state; supply sensible 1-based
positions. Keep fixtures/data with the lesson or in a supporting module. See
`src/lessons/alphabet.tsx` and `src/lessons/grammar.tsx` for complete alphabet and
conversation compositions; `tests/fixtures/` contains alternate prop sets.
Do not enable preview controls or introduce audio/AI services as part of authoring.

## Language metadata and current font limits

Each curriculum has separate instruction and target language objects: `tag` is a
BCP 47 language tag (e.g. `en`, `es`); optional `script` is an ISO 15924 code
(e.g. `Latn`), and optional `dialect` is a descriptive variety label. This metadata
does not translate content, choose fonts, configure text direction, or automatically
populate activity props. Conversation language names must still be supplied.

The shell currently loads **Michroma Regular** for headings and **Roboto Regular**
for body/target text (`src/app/_layout.tsx`, `src/styles/theme.ts`,
`src/components/AppText.tsx`). There is no script-specific font selection or
validated glyph/fallback strategy. **CJK and RTL support has not been validated**;
a tag or script code is not a support claim. Before shipping another writing
system, validate glyph coverage, direction/shaping, wrapping, compact and large-text
layouts, accessibility, and activity gestures on target devices. Font/direction
work and functional practice remain separate future tasks.

## Author checks

Run `npm run lint`, `npm run typecheck`, and `node --test tests/*.test.cjs`.
`tests/lessonAuthoringGuide.test.cjs` also typechecks the complete example above.
For your new content, inspect its parameterized URL and expected list position,
text/activity order, compact and large-text layout, accessibility labels, and
still-disabled preview controls. Report unavailable device/browser checks rather
than treating metadata or Node wiring tests as visual/native validation.
