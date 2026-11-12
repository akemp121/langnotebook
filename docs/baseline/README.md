# Working-shell baseline

Reference source: commit `ef2390d`, before PLAN1 task 2. This records the static shell in `docs/SPEC.md`, not a finished curriculum or functional activities. No application code or dependencies changed.

## Capture environment and results

- Expo 58 (`~58.0.23`), development web server: `npm run web -- --port 8081`.
- Playwright 1.65.0 / headless Chromium 158, **390 × 844 CSS px**, DPR 1, portrait, touch/mobile emulation, default text size. These are browser viewport captures, **not iOS/Android screenshots**.
- Fonts were ready before capture. Screenshots are individual scroll positions, not stitched full-page images. Reproduce by opening the routes below and scrolling to the named headings with the same viewport.
- Both list links, both circular back buttons, direct entry to each lesson followed by circular back, and browser history back from alphabet to the list passed. No browser page errors were observed.
- Each lesson exposes eight disabled buttons in the rendered web accessibility tree. Source confirms `disabled` plus `accessibilityState={{ disabled: true }}`; no real audio, answers, recording, or AI behavior is expected.
- `npm run lint` and `npm run typecheck`: passed.

## Routes, order, and content to preserve

| Route | Baseline |
| --- | --- |
| `/` | “Choose a notebook preview”; **Alphabet preview first**, **Grammar notebook preview second**. Both say “Notebook shell” / “Preview only” and offer “Open shell”. No progress tracking. |
| `/lessons/alphabet` | “Alphabet preview” / “Alphabet”; introduction → **Alphabet** section → explanatory text → **Letter sounds** activity → reflection. Letter **a**, hint `like “o” in “spot”`, words **espalda, apoyar, jalar**; then **b**, hint `same as in English`, words **borrar, probar, basado**. All two letter and six word audio buttons disabled. |
| `/lessons/grammar` | “Grammar preview” / “Grammar notebook”; **Transitivity** explanation → **Practice classifying transitivity** → **Applied to the target language** explanation → **Practice a short conversation** → **Further along in the transitivity section...** → **Next section...** → **User continues scrolling**. One continuous lesson scroll, not separate routes. |

Classification: **1/10**, “The child reads a book.”, instruction “Classify whether the highlighted action points toward an object.”; **Transitive / Intransitive** answers and previous/next arrows disabled. Preview banner says advancement, checking, scoring, and feedback are not implemented.

Conversation: **1/8**, “Listen to the situation, then practice answering out loud in the target language.” Tutor: **¿Adónde vas? / Where are you going?** Learner: **Voy al mercado. / I am going to the market.** Previous/next arrows, **Ask question**, and **Submit** disabled. The microphone is a static image-role View, **not an enabled recording button**; “Tap-to-record placeholder” remains visible. Preview banner disclaims recording, transcription, AI responses, and submission.

Back: the header’s dark **48 × 48 circular ‹** is labeled “Return to lesson previews”. Both routes use `router.dismissTo('/')`, returning to the list even on direct entry. Source also registers an Android-only focused hardware-back handler that uses the same return action and consumes the event; this native path has **not** been executed here. The back button scrolls with the header rather than staying fixed.

## Reference screenshots

| File | Scroll position |
| --- | --- |
| [01-list-top.png](01-list-top.png) | List heading and first card |
| [02-list-grammar.png](02-list-grammar.png) | Second list card |
| [03-alphabet-top.png](03-alphabet-top.png) | Alphabet header and explanation |
| [04-alphabet-activity.png](04-alphabet-activity.png) | Both letter cards and reflection |
| [05-grammar-top.png](05-grammar-top.png) | Grammar header and opening explanation |
| [06-grammar-classification.png](06-grammar-classification.png) | Classification preview |
| [07-grammar-conversation.png](07-grammar-conversation.png) | Conversation preview, microphone, and actions |
| [08-grammar-continuation.png](08-grammar-continuation.png) | Remaining three grammar headings in sequence |

Visual baseline: white notebook background, pale rounded bordered cards, charcoal controls, Michroma headings, Roboto body/target text, generous vertical gaps and wrapped controls. At 390 px the lesson horizontal padding is 24 px. **Known environment artifact:** speaker/microphone emoji show missing-glyph boxes in this Linux browser; the small lightning overlay is Expo development UI, not lesson content. Do not mistake either for a newly introduced refactor regression or claim native glyph support from these captures.

## Final walkthrough comparison checklist

Leave these unchecked until the final refactor walkthrough; the observations above are the starting reference.

- [ ] `/` retains the two cards in the same order, copy, preview labels, and working links.
- [ ] Both original lesson URLs (including direct entry) retain titles, text, activity order, fixtures, and reflection/final sections shown above.
- [ ] Compare all eight screenshot positions at 390 × 844: typography, card framing, wrapping, spacing, and circular back control remain consistent.
- [ ] Scroll the entire grammar lesson without route changes, clipped controls, or missing final content; alphabet still ends with reflection.
- [ ] All preview controls remain disabled (8 per lesson); counters and dialogue do not advance; microphone stays noninteractive.
- [ ] Circular back from list entry and direct entry returns to `/` for both lessons; browser history back still works.
- [ ] Check compact widths below 380 px and large system text separately; neither was covered by this baseline capture.
- [ ] **Unavailable here:** Android hardware/gesture back, native cold-start/deep links, native scrolling/performance, iOS back behavior, device safe areas/status bars, native emoji rendering, VoiceOver/TalkBack, and OS font scaling. `adb devices` reported no attached device/emulator; no iOS simulator/Xcode was available. Validate on target devices later rather than treating browser emulation as native coverage.
