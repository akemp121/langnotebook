# Synthetic cross-curriculum fixture (step 13)

Open `/lessons/synthetic-tone-lab/pitch-paths` while running the app (`npm run web`
for a web development session). This uses the existing
`src/app/lessons/[curriculumId]/[lessonId].tsx` route, `LessonScreen`, and
`LessonLayout`; there is no fixture-specific screen or renderer branch.

- Definition: `src/fixtures/toneCurriculum.tsx`.
- Custom graphic: `src/fixtures/StaticToneGraphic.tsx`, built only from existing
  `View`, `StyleSheet`, and `AppText` primitives. Three hand-placed dot paths sit
  between text blocks, using `withCard: false` for their own presentation.
- The same lesson supplies invented data to `AlphabetPreview` and
  `ClassificationPracticePreview`. Their controls remain disabled.
- `curriculumCatalog` resolves the original curriculum and this second curriculum.
  The home list uses `lessonListCatalog`, which contains only the two original
  previews. The fixture is bundled and direct-route accessible, not hidden behind
  a development-build flag, but it is deliberately not a main-list lesson.

All examples are explicitly synthetic. The target tag `art-x-tone-demo` labels
invented Latin-script content, not a supported real language. The diagram is not
measured audio or language-specific guidance. No tone detection, microphone use,
playback, scoring, or teaching-quality claim is implied.

## Checks

`node --test tests/*.test.cjs` passes all 68 tests, including four new checks in
`tests/crossCurriculumFixture.test.cjs` for real route-to-layout wiring, catalog/list
separation, configurable preview reuse and disabled controls, and the static
graphic's accessible description and dot positions. Native primitives/navigation
hooks are stubbed, so these checks do not establish visual or native behavior.
`npm run lint` and `npm run typecheck` also pass.

Browser/device rendering, screen-reader behavior, native back navigation, and
large-text appearance were not exercised in this environment.
