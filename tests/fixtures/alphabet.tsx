import { AlphabetPreview } from '@/components/AlphabetPreview';

// Synthetic UI data only: invented sound hints/words, not curriculum or a main-list lesson.
export const syntheticAlphabetPreview = (
  <AlphabetPreview
    letters={[
      {
        id: 'synthetic-x',
        letter: 'x',
        pronunciationHint: 'Synthetic sound one',
        examples: [{ id: 'sample-one', label: 'xim' }],
      },
      {
        id: 'synthetic-y',
        letter: 'y',
        pronunciationHint: 'Synthetic sound two',
        examples: [
          { id: 'sample-one', label: 'yim' },
          { id: 'sample-two', label: 'yom' },
        ],
      },
      {
        id: 'synthetic-z',
        letter: 'z',
        pronunciationHint: 'Synthetic sound three',
        examples: [],
      },
    ]}
  />
);
