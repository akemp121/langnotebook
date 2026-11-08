export type AlphabetExampleWord = {
  readonly id: string;
  readonly label: string;
};

export type AlphabetLetterPreview = {
  readonly id: string;
  readonly letter: string;
  readonly pronunciationHint: string;
  readonly examples: readonly AlphabetExampleWord[];
};

export const alphabetLetterPreviews: readonly AlphabetLetterPreview[] = [
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
