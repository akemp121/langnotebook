import { AlphabetPreview, type AlphabetLetterPreview } from '@/components/AlphabetPreview';
import type { Lesson } from '@/types/curriculum';

const alphabetLetterPreviews: readonly AlphabetLetterPreview[] = [
  {
    id: 'a-open-vowel',
    letter: 'a',
    pronunciationHint: 'like “o” in “spot”',
    examples: [
      { id: 'espalda', label: 'espalda' },
      { id: 'apoyar', label: 'apoyar' },
      { id: 'jalar', label: 'jalar' },
    ],
  },
  {
    id: 'b-plain-consonant',
    letter: 'b',
    pronunciationHint: 'same as in English',
    examples: [
      { id: 'borrar', label: 'borrar' },
      { id: 'probar', label: 'probar' },
      { id: 'basado', label: 'basado' },
    ],
  },
] as const;

export const alphabetPreviewLesson: Lesson = {
  id: 'alphabet',
  title: 'Alphabet',
  listDisplay: {
    title: 'Alphabet preview',
    eyebrow: 'Notebook shell',
    summary: 'A static entry for the alphabet layout: letter cards, pronunciation hints, and audio controls later.',
    layoutNote: 'Explainer text → letter activity card → short reflection text',
    estimatedLength: 'Preview only',
  },
  eyebrow: 'Alphabet preview',
  introduction: [
    'A notebook-style preview of letter cards, pronunciation hints, and example-word audio buttons using sample text only.',
  ],
  sections: [
    {
      id: 'alphabet-overview',
      title: 'Alphabet',
      blocks: [
        {
          id: 'alphabet-intro',
          kind: 'text',
          paragraphs: [
            'Small description of the nature of this language’s alphabet. These cards are static preview content, so the audio controls are intentionally nonfunctional.',
          ],
        },
        {
          id: 'alphabet-letter-cards',
          kind: 'activity',
          eyebrow: 'Static preview',
          title: 'Letter sounds',
          children: <AlphabetPreview letters={alphabetLetterPreviews} />,
        },
        {
          id: 'alphabet-reflection',
          kind: 'text',
          paragraphs: [
            'Later lessons can expand this pattern with more letters, real pronunciation audio, and short listening checks while keeping the same notebook flow.',
          ],
        },
      ],
    },
  ],
};
