# Step 15 — refactor verification

Fresh automated revalidation on **2026-11-17 (UTC)** checked HEAD
`0de969a398786d422570da69d6d64c0210f43559`. The pre-existing harness-owned
`PLAN1.md` working-tree change was left untouched; this follow-up changes only
this verification record. No application behavior, curriculum, dependency,
native project, or test framework was changed.

**Evidence scopes differ:** the automated results below are fresh at that HEAD;
the browser measurements, screenshots, and visual comparison are historical,
recorded against `db7c7d6` plus the step-15 tests/artifacts. No browser walkthrough
or screenshot comparison was repeated in this follow-up. The historical evidence
shows the original static shell preserved in its checked web viewports, not fresh
native-device or accessibility verification.

## Fresh checks run

Environment: Linux, Node `v22.22.1`, npm `9.2.0`, Python `3.14.4`.
All four commands ran against the checked revision and exited **0**.

| Command | Started (UTC) | Fresh result |
| --- | --- | --- |
| `npm run lint` | 05:22:35 | Pass (`expo lint`) |
| `npm run typecheck` | 05:22:37 | Pass (`tsc --noEmit`) |
| `node --test tests/*.test.cjs` | 05:22:39 | **73 pass**, 0 fail/cancelled/skip/todo |
| `python3 -m unittest discover -s tests -p 'test_*.py'` | 05:22:40 | **78 pass**, `OK` (existing harness tests, not UI coverage) |
| `git diff --check` | After checks and after this record update | Pass |

The fresh **78-test** Python result supersedes the historical **20-test** result;
the latter did not cover the expanded harness suite. Python tests deliberately
exercise failure/recovery paths in temporary repositories, so their logs include
simulated failure reports; the overall suite passed.

Full command output for this follow-up is in
`/tmp/langnotebook-step15-recheck-0de969a/{lint,typecheck,node,python}.log` in the
execution environment (temporary, not a durable repository artifact). The table
above preserves the command results; the Node and Python output summaries were:

```text
# tests 73
# suites 0
# pass 73
# fail 0
# cancelled 0
# skipped 0
# todo 0

Ran 78 tests in 3.601s

OK
```

There is no `npm test` script. Existing Node tests use the built-in runner and
stub native primitives/navigation; no framework was added. The previously added
four Node checks exercise actual legacy/parameterized route-to-content parity,
baseline content order, a single scroll container, disabled controls, and the
absence of Android hardware-back listeners on iOS/web. Existing tests cover the
Android listener's return value, list target, and cleanup **with mocks only**.

## Fresh source review

Reviewed the current route/shared-screen/back-hook/layout/catalog, configurable
preview controls, `AppText`, synthetic composition, and associated route tests:

- Original route wrappers still supply the same catalog IDs as the parameterized
  route. That route rejects array/non-string params; `LessonScreen` provides the
  readable missing-lesson fallback and shared return action.
- Catalog list order remains explicitly Alphabet → Grammar; the synthetic
  curriculum resolves through the shared route but is excluded from the list.
- The shared hook retains `dismissTo('/')` and its focused Android-only hardware
  listener with cleanup. Actual native navigation remains unverified.
- `LessonLayout` retains one continuous scroll container, inset-based padding,
  compact spacing, and a 48 × 48 circular back control. It renders arbitrary
  activity children and supports the existing `withCard: false` opt-out.
- Alphabet/classification/conversation previews retain disabled controls without
  action handlers. Stable fixture IDs and configurable props remain intact; the
  tone fixture places its self-framed static graphic between paragraphs.
- `AppText` retains variant-specific native scaling caps. Browser font-size
  multiplication cannot verify OS text scaling or compact-plus-large-text layout.

`git diff --quiet db7c7d6 HEAD -- src package.json package-lock.json bun.lock`
exited **0**: source and dependency manifests are unchanged from the recorded
browser baseline. Subsequent test changes are covered by the fresh suites above.
This supports retaining the historical browser evidence; it does **not** turn it
into a fresh walkthrough. No repair finding required an application change.

## Historical browser walkthrough (not rerun)

The following environment, observations, measurements, and linked artifacts are
from the earlier walkthrough, not the fresh automated run above. Its recorded
result was **pass**, with no browser `pageerror` events.

- Expo **58.0.23**, `npm run web -- --port 8081`, CI mode.
- Already available Playwright **1.65.0**, headless Chromium **158.0.8127.18**;
  mobile/touch emulation, DPR 1, **390 × 844 CSS px**, fonts ready before capture.
  Also **320 × 844** and **360 × 844** compact viewports.
- [Reproducible optional script](walkthrough.cjs), [route/layout measurements](browser-results.json),
  and [screenshots](screenshots/). Playwright is **not** a project dependency or a
  prerequisite for the existing Node suite. To repeat with a separately available
  Playwright installation/browser:

  ```sh
  npm run web -- --port 8081
  # In a second terminal; omit PLAYWRIGHT_MODULE if already resolvable:
  PLAYWRIGHT_MODULE=/absolute/path/to/playwright node docs/verification/walkthrough.cjs
  ```

  This run used the existing cached Playwright installation. Chromium initially
  failed because `libnspr4.so` was absent; Ubuntu `libnspr4`, `libnss3`, and
  `libasound2t64` packages were extracted under `/tmp/langnotebook-browser-libs`,
  and that directory's `usr/lib/x86_64-linux-gnu` was supplied via
  `LD_LIBRARY_PATH`. No app/package/lockfile changes were needed.

| Area | Observed result |
| --- | --- |
| List/order | Exactly two linked cards: Alphabet, then Grammar; original copy, preview labels and framing retained. Links now use `/lessons/notebook-preview/alphabet` and `/lessons/notebook-preview/grammar` as intended. Synthetic curriculum is absent from the list. |
| Original and parameterized routes | `/lessons/alphabet`, `/lessons/grammar`, and both parameterized equivalents open directly. Each pair has identical rendered body text and eight disabled preview buttons. |
| Invalid IDs | Unknown curriculum/lesson, prototype-like IDs, encoded slash and whitespace IDs show **Lesson not found**. Its return action reaches `/`. A missing required segment (`/lessons/notebook-preview`) shows Router's **Unmatched Route**, not the lesson fallback; this expected Router page has different styling. Missing/array params are also covered in mocked Node checks. |
| Circular/browser back | Both legacy and parameterized direct entries return to `/`. Both home-list links support circular return and browser history back. Circular target is still 48 × 48, with the original label, and scrolls with the header; using it after reaching the lesson end works. |
| Long scroll | Each original/parameterized lesson has exactly one vertically overflowing container. Alphabet reaches its reflection; Grammar reaches classification → applied explanation → conversation → continuation → next section → final paragraph without URL changes. At 390 px their scroll heights are 1274 and 3750 px respectively. |
| Disabled controls | Eight per original lesson, nine in the synthetic composition: native DOM `disabled` and `aria-disabled` remain true. Attempted DOM clicks leave text/counters unchanged. Conversation stays at 1/8, classification at 1/10; microphone is an image-role non-tab-focusable placeholder. Node checks additionally confirm no action handlers are supplied. |
| Compact | At 320/360 px, both lessons reach their final content with no measured horizontal overflow of text/buttons/links. At 320 px classification choices stack; alphabet hints and word buttons wrap. No shell layout change was needed. |
| Enlarged text approximation | At 390 px, browser-rendered text font sizes **and line heights** were multiplied by 1.5. Text/choices wrap and both final paragraphs remain reachable; disabled state is retained and no horizontal overflow was measured. This is a browser stress approximation, **not OS font scaling**; it does not reproduce native `AppText` scaling caps. Compact + enlarged text together was not tested. |
| Synthetic composition/reuse | `/lessons/synthetic-tone-lab/pitch-paths` opens through the same shared route/layout, with prose → self-framed static dot graphic → prose, then reused alphabet and three-choice classification cards. All nine preview controls stay disabled. Separate Node fixtures verify synthetic alphabet, three-category classification, and French/German conversation props/reordering without renderer changes. The standalone French/German fixture was not visually rendered. |

## Historical baseline visual comparison (not repeated)

The earlier walkthrough compared all eight positions in [the original baseline](../baseline/README.md)
with the same numbered [new screenshots](screenshots/). Titles, Michroma/Roboto
typography, 24 px lesson side padding, white background, pale rounded cards,
control wrapping, spacing, circular back control, fixtures, and continuation
headings remain visually consistent. These are visual comparisons, not a claim
of automated pixel-perfect diffing. The original Expo development lightning
overlay is absent in this CI-mode capture; it is not application content.
The baseline's Linux missing-glyph boxes for speaker/microphone emoji persist.

Additional evidence:

- [320 px alphabet](screenshots/compact-alphabet.png),
  [320 px classification](screenshots/compact-grammar.png).
- [150% alphabet](screenshots/large-text-alphabet.png),
  [150% conversation](screenshots/large-text-grammar.png),
  [150% conversation actions](screenshots/large-text-grammar-actions.png).
- [Custom static graphic](screenshots/synthetic-graphic.png),
  [three-choice reuse](screenshots/synthetic-choices.png),
  [Router unmatched page](screenshots/invalid-missing-segment.png).

## Remaining device coverage and limitations

Fresh environment check: `adb devices` lists **no connected Android
device/emulator**, and `xcrun` is unavailable on this Linux host. No native checks
were performed. The following remain **unverified**:

- Real Android hardware/gesture back and iOS navigation/gestures, cold starts and
  native deep links (mocked hooks and web history do not establish these).
- Native scrolling smoothness/performance, safe areas/status bars/notches,
  physical-device touch targets and native emoji/glyph rendering.
- Large **system** text/Dynamic Type with the actual font-scaling caps, compact
  width combined with large text, VoiceOver/TalkBack, and screen-reader traversal.
- CJK/RTL/script-specific fonts, direction, glyph coverage, and real multilingual
  teaching quality. Metadata and invented Latin-script examples prove none of these.

No web-shell regression was reported in the historical exercised cases; fresh
automated checks and source review found no additional regression. Missing emoji
glyphs remain a known browser-environment limitation. Step-15 automated
revalidation and the results record are complete; browser freshness and the device
coverage above are **not** claimed. Device follow-up is needed before claiming
native/accessibility coverage. Audio, recording, AI, scoring, progress,
persistence, and real curriculum remain deliberately unimplemented. Only step 15
was addressed; no later work was started and `PLAN1.md` was not edited by this
follow-up.
