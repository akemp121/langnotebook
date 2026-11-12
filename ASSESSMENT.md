# Curriculum and Custom-Activity Scalability Assessment

## Verdict

**The current app supports arbitrary custom activity UI, but does not yet provide low-friction, scalable curriculum authoring or reusable functional activities.** It is a sound UI foundation, not a finished curriculum/activity platform.

A developer can already place a new Mandarin tone activity in a lesson without modifying the shared lesson renderer. However, reusing activities across many lessons and languages currently requires source-code changes and, for the existing previews, refactoring hard-coded content. Shared state, persistence, AI/audio services, and language-specific presentation have not been designed yet.

This is consistent with the limited scope of `PLAN1.md` and part 1 of `docs/SPEC.md`: these deliberately implement only a static shell and navigation. The gaps below are next-stage architectural work, not evidence that the shell failed its original scope. **Keep the shell and its composition model; extend it rather than rewrite it.**

## What already scales well

### 1. Activity contents are genuinely open-ended

In `src/components/LessonLayout.tsx`, `LessonActivityBlock.children` is a `ReactNode`. The renderer wraps those children in `ActivityCard`; it does not switch between a fixed list of classification, conversation, or alphabet activity types.

Consequently, a lesson can embed an independently implemented tone-contour visualizer, listening comparison, drawing surface, or other custom React component in the same place as the existing previews. That component can own its interaction logic. Adding such a component does not require another block kind or a change to `renderBlock`.

This already satisfies the most important part of the Jupyter analogy: **the notebook controls document flow, while each activity controls its own contents.** The two block kinds, `text` and `activity`, do not mean there are only two possible exercise types.

There are practical boundaries: these are trusted components bundled with the app, not arbitrary remotely supplied executable code. A custom native capability may require dependencies and a new app build. The existing extension point is not a runtime plugin loader, sandbox, or notebook code-execution environment—and none is necessary for the stated requirement.

### 2. Lesson sequence is not tied to one language

`LessonSection.blocks` can contain text and activity blocks in any order and number. `src/app/lessons/grammar.tsx` demonstrates several sections in one scrolling lesson. The layout does not require every curriculum to use transitivity, an alphabet, or the same activity sequence.

Mandarin could introduce tones early, another language could introduce aspect early, and a nonalphabetic writing system need not use the alphabet preview. The shared structure can remain consistent without standardizing every curriculum's pedagogy.

### 3. Presentation is already separated into reusable pieces

`LessonLayout`, `ActivityCard`, `AppText`, and `src/styles/theme.ts` provide reusable document structure, card presentation, typography, and styling. Activity implementations live outside `src/app/`, separate from navigation.

`ActivityCard` has no fixed content height, which helps it accommodate different activity shapes. Its appearance is not intrinsically tied to classification or conversation.

## Where the current setup creates friction

| Area | Evidence in the current code | Effect on curriculum scaling |
| --- | --- | --- |
| Classification reuse | `ClassificationPracticePreview.tsx` takes no props, owns a module-local prompt, and restricts answer IDs to `transitive` or `intransitive`. | A second classification topic cannot simply provide its own questions. Content and domain-specific assumptions must first be extracted. |
| AI/conversation reuse | `ConversationPracticePreview.tsx` takes no props and embeds Spanish dialogue, English translations, and static controls. | It is reusable visually, but there is no implemented AI practice engine, configurable task, or language-aware service contract. |
| Alphabet reuse | `AlphabetPreview.tsx` directly imports `alphabetLetterPreviews`. | Fixture data is separated from rendering, but callers cannot supply another language's material through props. |
| Curriculum organization | Section arrays and JSX activity instances live in `src/app/lessons/alphabet.tsx` and `grammar.tsx`. `lessonPreviews.ts` enumerates two preview IDs and concrete routes. | Each new lesson currently means maintaining screen/content code and catalog entries. There is no curriculum catalog, language-pair model, or shared lesson lookup. |
| Content portability | Activity blocks hold `ReactNode` values. | Excellent code composition, but these lesson definitions are not plain serializable content that can be loaded directly from JSON, storage, or an authoring system. |
| Activity lifecycle | Blocks have IDs, but no defined attempt, completion, result, restoration, or service interfaces. | Each future activity could independently reinvent persistence, recording, submission, and progress semantics. |
| Language presentation | `AppText` uses the same body font for all target text; root font loading bundles Michroma and Roboto. Text blocks contain only paragraph strings. | There is no explicit script/font/direction policy, mixed-language annotation model, or token identity for future vocabulary saving. Platform fallback may display other scripts, but adequate rendering is not established. |
| Rich document content | Text blocks have no structured inline spans, examples, tables, annotations, or help context. | An activity can technically render these, but treating all rich explanatory content as an activity would blur responsibilities and make word saving/contextual help harder. |
| Heavy interactive lessons | `LessonLayout` maps every section and block inside one `ScrollView`. | All activity components mount together. This is reasonable for the static shell, but many audio, recording, or visualization components could become expensive. No performance failure has been demonstrated yet. |

All preview controls are intentionally disabled. Their existence should not be interpreted as evidence that classification checking, recording, transcription, AI feedback, or tone assessment already works.

## Recommended steps

### 1. Separate curriculum definitions from routes

Before implementing substantial curriculum content, introduce curriculum/lesson definitions outside `src/app/`. Give curricula language-pair metadata, an explicitly ordered lesson list, and stable lesson, section, and block IDs. Include script/dialect information where relevant, rather than assuming one undifferentiated target-language string.

Use a shared lesson screen and curriculum/lesson lookup instead of creating a separate screen implementation for every lesson. Preserve each curriculum's ability to choose its own ordering, prerequisites, explanations, and activities. Stable IDs should not depend on array position or displayed text, since future saved progress and vocabulary references will need durable identities.

**Do not require a CMS or fully serializable format immediately.** Developer-authored TypeScript/TSX lesson modules are a valid first implementation and preserve the existing arbitrary-component flexibility.

### 2. Turn common previews into configurable activity components

Separate fixture content from behavior and presentation:

- **Classification:** accept prompts, unrestricted stable choice IDs, labels, correct-answer/evaluation configuration, and feedback. Do not encode transitivity into the reusable component's types. Support the number of categories required by the task, rather than assuming two.
- **AI practice:** accept task instructions, scenario/examples, target and instruction languages, and evaluation criteria. Keep the underlying AI/transcription integration separate from the card UI.
- **Alphabet/sound activities:** accept their dataset and media references instead of importing one global fixture.

Extract shared question navigation and feedback UI only where behavior is actually shared. A tone drawing task should not have to pretend it is a multiple-choice question or a conversation.

### 3. Establish a small activity-host contract without restricting activity internals

Provide common context such as curriculum/lesson/block identity, language pair, and access to shared capabilities. Define optional state restoration and result reporting, with versioned activity-specific payloads where needed.

The host should understand only general events such as attempt started, progress changed, and completed. Individual activities should retain control of their UI, answer representation, feedback, and evaluation logic. Not every activity needs a score, submission button, or even a notion of correctness.

Keep reusable capabilities—audio playback, recording, transcription, AI requests, and eventually vocabulary saving—behind focused service interfaces. Activities should request only the capabilities they need. Handle unavailable permissions, unsupported languages, cancellation, loading, and failures explicitly. Keep provider credentials and privileged AI calls off the client.

This contract is needed as real activities arrive; persistence itself can remain deferred until its planned stage.

### 4. Preserve a custom-component escape hatch if adding data-driven authoring

If lessons later need to be plain data, add an activity registry mapping a stable activity type to its component and validated configuration. Standard activities could then be configured repeatedly without writing JSX. Validate unknown types and configuration versions and provide a useful unsupported-activity fallback.

Registering one new custom activity should be enough to make it available to many lessons; the notebook renderer should not need a growing list of domain-specific conditionals. Retain a developer-authored custom-component path for activities that do not fit standard configuration shapes.

A registry is **optional for bundled TSX lessons**, not a prerequisite for arbitrary activities. JSON describes configuration; new executable activity implementations still need to ship with the application. Avoid building a remote-code execution system to meet this requirement.

### 5. Make language and document presentation extensible

Introduce an explicit policy for target-language fonts, script-aware sizing, text direction, and mixed native/target-language passages. Validate actual CJK, diacritics, and RTL samples on supported devices instead of assuming the current fonts and line heights are sufficient.

Evolve explanation content to support stable text segments and inline annotations when needed: target/native language identity, pronunciation or transliteration, translations, vocabulary references, and contextual-help anchors. Keep plain paragraphs easy to author; do not force every lesson into a heavyweight format.

Make the activity card wrapper optional or configurable if future activities need edge-to-edge graphics or a different presentation. Today every activity is wrapped in the same card, and `LessonActivityBlock` does not expose `ActivityCard`'s style prop. This is a presentation constraint, not a restriction on what component can be embedded.

### 6. Add lifecycle, performance, and extension tests as activities become functional

Mounting the notebook should not start recording, playback, or expensive AI work. Define activation and cleanup behavior, including cancellation when leaving a lesson. Profile representative 10–15-minute lessons on mobile before deciding whether lazy mounting or virtualization is necessary; if blocks unmount, preserve their state outside the component.

Use the TDD approach requested in `docs/SPEC.md` for real activities. Test configurable classification with unrelated category sets, AI services through test doubles, state restoration, unavailable capabilities, and accessibility. Include script rendering and gesture/scroll interactions for custom activities.

## Concrete scalability acceptance check

Before calling the curriculum architecture scalable, demonstrate the following:

1. Two lessons in different curricula reuse the same classification implementation with different category sets and content, without modifying that component.
2. AI practice accepts both languages' task/context configuration without embedding either curriculum's content in the engine.
3. A Mandarin tone activity is implemented as an independent component and placed between explanation blocks without modifying `LessonLayout` or unrelated activities. It can own a contour/listening interaction rather than adopting the classification template.
4. Adding another lesson uses the curriculum catalog and shared screen rather than copying a route implementation.
5. Activity state survives whichever navigation/unmount behavior the app promises, and unavailable recording or AI services fail gracefully.

Tone recognition/evaluation is a separate technical feasibility question: speech transcription alone does not demonstrate reliable tone assessment. A tone activity can begin with listening discrimination or visual exercises while evaluation capabilities are validated independently.

## Scope and verification

This assessment reviews `docs/SPEC.md`, `PLAN1.md`, the lesson routes/catalog, shared lesson/card/text components, and all three activity previews. It is based on source inspection, not device performance or language-rendering tests. No automated test files were found in the project source reviewed.

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- No application code or dependencies were changed. Only this assessment was created; the pre-existing modification to `PLAN1.md` was left untouched.

**Bottom line:** arbitrary activity embedding already works architecturally. The next investment should be configurable reusable activities, curriculum/content separation, and a small shared runtime contract—not a new notebook renderer or an exhaustive taxonomy of every possible exercise.
