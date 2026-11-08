import { AlphabetPreview } from '@/components/AlphabetPreview';
import { LessonLayout, type LessonSection } from '@/components/LessonLayout';
import { useLessonBackNavigation } from '@/hooks/useLessonBackNavigation';

const alphabetPreviewSections: readonly LessonSection[] = [
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
        children: <AlphabetPreview />,
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
];

export default function AlphabetPreviewRoute() {
  const returnToLessonList = useLessonBackNavigation();

  return (
    <LessonLayout
      backAccessibilityLabel="Return to lesson previews"
      eyebrow="Alphabet preview"
      introduction={[
        'A notebook-style preview of letter cards, pronunciation hints, and example-word audio buttons using sample text only.',
      ]}
      onBack={returnToLessonList}
      sections={alphabetPreviewSections}
      title="Alphabet"
    />
  );
}
