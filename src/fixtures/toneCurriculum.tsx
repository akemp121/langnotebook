import { AlphabetPreview } from '@/components/AlphabetPreview';
import { ClassificationPracticePreview } from '@/components/ClassificationPracticePreview';
import type { CurriculumRegistration } from '@/data/createCurriculumCatalog';
import type { Lesson } from '@/types/curriculum';

import { StaticToneGraphic } from './StaticToneGraphic';

/** Invented Latin-script examples for composition checks, not a language course. */
export const syntheticToneLesson: Lesson = {
  id: 'pitch-paths',
  title: 'Synthetic tone composition fixture',
  eyebrow: 'Development fixture · not a real lesson',
  introduction: [
    'This invented example tests a second curriculum in the notebook shell. It is not sourced language instruction and makes no teaching-quality claim.',
    'Everything here is static: there is no audio playback, microphone input, tone detection, evaluation, or scoring.',
  ],
  sections: [
    {
      id: 'illustrative-paths',
      title: 'An illustration between paragraphs',
      blocks: [
        {
          id: 'before-graphic',
          kind: 'text',
          paragraphs: [
            'For this synthetic fixture only, imagine pitch as a line moving across a small diagram. The dots below are hand-placed illustrations, not measurements or rules for any real language.',
          ],
        },
        {
          id: 'static-tone-graphic',
          kind: 'activity',
          withCard: false,
          children: <StaticToneGraphic />,
        },
        {
          id: 'after-graphic',
          kind: 'text',
          paragraphs: [
            'The notebook continues after the graphic in the same scroll. This custom content has its own framing and no questions, answers, conversation turns, or controls.',
          ],
        },
      ],
    },
    {
      id: 'reused-previews',
      title: 'Existing previews, invented content',
      blocks: [
        {
          id: 'synthetic-symbols',
          kind: 'activity',
          eyebrow: 'Static fixture',
          title: 'Invented symbol samples',
          children: (
            <AlphabetPreview
              letters={[
                {
                  id: 'sample-a',
                  letter: 'a',
                  pronunciationHint: 'Invented sample A; no pronunciation claim',
                  examples: [{ id: 'sample-la', label: 'la' }],
                },
                {
                  id: 'sample-e',
                  letter: 'e',
                  pronunciationHint: 'Invented sample E; no pronunciation claim',
                  examples: [{ id: 'sample-le', label: 'le' }],
                },
              ]}
            />
          ),
        },
        {
          id: 'synthetic-path-choices',
          kind: 'activity',
          eyebrow: 'Static fixture',
          title: 'Example path labels',
          children: (
            <ClassificationPracticePreview
              questionNumber={1}
              totalQuestions={1}
              prompt="Synthetic path B"
              instruction="These disabled choices demonstrate configurable UI only; no response is checked."
              choices={[
                { id: 'level', label: 'Level' },
                { id: 'rising', label: 'Rising' },
                { id: 'falling', label: 'Falling' },
              ]}
            />
          ),
        },
      ],
    },
  ],
};

/** Route-only bundled development fixture; deliberately excluded from the home list. */
export const syntheticToneRegistration: CurriculumRegistration = {
  curriculum: {
    id: 'synthetic-tone-lab',
    title: 'Synthetic tone lab (development fixture)',
    instructionLanguage: { tag: 'en', script: 'Latn' },
    targetLanguage: { tag: 'art-x-tone-demo', script: 'Latn' },
    lessonIds: ['pitch-paths'],
  },
  lessons: [syntheticToneLesson],
};
