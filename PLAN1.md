# Plan 1.1 — Curriculum and Activity Extensibility

## Goal and scope

Prepare the completed UI shell for different language curricula without building features before they are needed. This bridges parts 1 and 2 of `docs/SPEC.md` and implements the immediate priorities from `ASSESSMENT.md`.

Each task targets **15–30 minutes of human work** and has a concrete completion check. Work in order and keep the app usable throughout. These estimates exclude environment setup and unexpected troubleshooting.

**Preserve:** the existing lesson list, `/lessons/alphabet` and `/lessons/grammar`, circular and Android hardware-back behavior, continuous scrolling, styling, safe-area spacing, accessible touch targets, and disabled preview controls.

**No database is required or assumed.** Lessons remain bundled TypeScript/TSX files. Use synthetic examples only; sourced Spanish curriculum design remains part 2, curriculum implementation part 3, functional activities part 4, and word saving/review part 5.

Before touching Expo, Router, or React Native APIs, follow `AGENTS.md`: check the installed Expo major and matching documentation. Avoid new dependencies unless necessary.

## Tasks

- [x] **1. Record the working-shell baseline.** Note the current routes, lesson order, visible activities, disabled controls, and back behavior; capture reference screenshots on an available mobile viewport. **Done when:** there is a short comparison checklist for the final walkthrough, with unavailable device checks identified. **Recorded:** [baseline checklist and eight mobile-web screenshots](docs/baseline/README.md); native-device checks explicitly unavailable.

- [x] **2. Extract minimal curriculum and lesson types.** Move lesson/section/block types out of `LessonLayout.tsx`. Add curriculum identity, instruction/target language tags, optional script/dialect metadata, and ordered lesson IDs. Keep plain paragraphs and arbitrary `ReactNode` activity contents. **Done when:** the existing layout compiles unchanged against the extracted types; IDs are explicit rather than derived from titles or positions.

- [x] **3. Move alphabet content out of its route.** Place its lesson definition and activity composition in a module outside `src/app/`. Leave navigation in the route. **Done when:** the original alphabet URL renders the same copy, cards, and layout from the extracted definition.

- [ ] **4. Move grammar content out of its route.** Extract the grammar lesson definition and JSX composition without changing its sections. **Done when:** the original grammar URL still displays all text and activities in the same continuous scroll.

- [ ] **5. Add a small bundled curriculum catalog.** Register the preview lessons with ordered curriculum metadata and lookup helpers. Reject duplicate identities and missing lesson references with useful errors. **Done when:** both lessons resolve by curriculum/lesson ID, unknown IDs return a controlled missing result, and ordering is explicit. Document ID uniqueness scopes.

- [ ] **6. Create a shared lesson screen.** Centralize catalog lookup, `LessonLayout` props, and existing back-navigation handling outside `src/app/`. Make both original routes thin wrappers. **Done when:** both previews use the same screen implementation and an unknown lesson shows a readable fallback with a return action.

- [ ] **7. Add one parameterized lesson route.** Use Expo Router parameters to open any catalog lesson through the shared screen. Retain both original preview URLs. **Done when:** adding another lesson needs no new route file, malformed/missing IDs do not crash, and direct entry/back navigation still work.

- [ ] **8. Populate the lesson list from the catalog.** Replace the hard-coded preview-ID enumeration with catalog-derived display entries and links. **Done when:** the main list retains its two existing preview cards and styling, while a new catalog entry needs no copied list-card or screen code.

- [ ] **9. Make classification preview content configurable.** Accept prompt, displayed question position, instructions, and choices through props; move the existing fixture to the lesson module. Replace transitivity-specific choice-ID types with strings and allow more than two choices. **Done when:** the same component displays the original example and a synthetic three-category example without implementation changes; controls remain disabled.

- [ ] **10. Make conversation preview content configurable.** Accept instructions, language context, and dialogue/translation content through props. Use stable turn IDs instead of speaker names as keys. **Done when:** the original Spanish example and a second synthetic language-pair example render through the same component, with no fixture import, AI connection, or enabled controls inside it.

- [ ] **11. Make alphabet preview content configurable.** Supply letter/sound data through props instead of importing a global dataset. **Done when:** the existing lesson supplies its current fixture and another dataset can render without changing the component; audio remains nonfunctional.

- [ ] **12. Allow custom activity presentation.** Keep the current card wrapper as the default and add a simple opt-out for activities needing their own framing. Preserve arbitrary React children rather than adding branches for individual exercise types. **Done when:** existing previews look unchanged and a custom component can render without card padding.

- [ ] **13. Prove cross-curriculum composition with a fixture.** Assemble a clearly labeled synthetic lesson for a second curriculum in a test/development fixture, not the main lesson list. Reuse configurable previews and embed a small static tone-themed graphic between paragraphs using existing primitives. **Done when:** it opens through the shared route without renderer changes or a new screen, demonstrating that custom content need not resemble classification or conversation. No tone detection or teaching-quality claim is implied.

- [ ] **14. Write a short authoring guide.** Document where lessons live, how to register/order them, ID conventions, supplying activity props, and embedding a custom component. Note language/script metadata and current font limitations without claiming CJK/RTL support has been validated. **Done when:** another developer can add a lesson or custom activity without copying a route or modifying the notebook renderer.

- [ ] **15. Verify the refactor and record results.** Walk through the original and parameterized routes, invalid IDs, lesson ordering, back behavior, long scrolling, compact layout, large text, and disabled controls. Check the synthetic examples for reuse and arbitrary composition. Run `npm run lint`, `npm run typecheck`, and any existing tests. **Done when:** checks pass, the original shell is preserved, and device coverage or remaining issues are honestly recorded. Do not introduce a test framework just to complete this static-shell milestone.

## Explicitly deferred

These assessment recommendations remain relevant but are **not prerequisites for Spanish curriculum design**:

- **Part 3, when content requires it:** richer annotated text, script-specific fonts/direction, and any genuinely needed data-driven authoring format. Keep bundled TSX and plain paragraphs as the default; no registry or CMS now.
- **Part 4, with real activities:** shared activity context/events, state restoration, audio/AI/transcription service contracts, cancellation, permission/error handling, and functional behavior. Define these around actual requirements and implement with TDD. Profile real interactive lessons before adding lazy mounting or virtualization.
- **Before persistent learner data is implemented:** choose device-only versus cloud storage based on offline, account, and synchronization needs. There is no database setup in this plan; part 5 still owns word saving and spaced review.
- **When another writing system is actually supported:** validate glyph coverage, direction, layout, accessibility, and activity gestures on target devices. Metadata alone does not establish language support.

## Completion

The same shell can display catalog-defined lessons, common preview activities accept different content, and an independently authored custom component fits between explanations. Existing behavior remains intact. This milestone does **not** claim functional AI practice, tone evaluation, persistent progress, or a completed multilingual curriculum.
