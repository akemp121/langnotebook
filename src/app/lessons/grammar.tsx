import { router } from 'expo-router';

import { ClassificationPracticePreview } from '@/components/ClassificationPracticePreview';
import { ConversationPracticePreview } from '@/components/ConversationPracticePreview';
import { LessonLayout, type LessonSection } from '@/components/LessonLayout';

const grammarPreviewSections: readonly LessonSection[] = [
  {
    id: 'transitivity-overview',
    title: 'Transitivity',
    blocks: [
      {
        id: 'transitivity-intro',
        kind: 'text',
        paragraphs: [
          'Some languages change a verb depending on whether the action points toward an object. This preview uses transitivity as the sample grammar idea.',
          'A transitive verb can take an object: you can carry something, read something, or open something. An intransitive verb stands on its own: you arrive, sleep, or laugh.',
          'The full lesson would slow down here with real examples. For now, the text stays short so the notebook structure is easy to scan.',
        ],
      },
      {
        id: 'transitivity-classification-practice',
        kind: 'activity',
        eyebrow: 'Static preview',
        title: 'Practice classifying transitivity',
        children: <ClassificationPracticePreview />,
      },
    ],
  },
  {
    id: 'applied-to-language',
    title: 'Applied to the target language',
    blocks: [
      {
        id: 'applied-placeholder-explanation',
        kind: 'text',
        paragraphs: [
          'This follow-on section represents the next part of the same scrolling lesson, not a separate route. It would connect the concept to the target language once curriculum content exists.',
          'A future version could compare two short sentence patterns and point out which verb form appears with an object.',
        ],
      },
      {
        id: 'conversation-practice-preview',
        kind: 'activity',
        eyebrow: 'Static preview',
        title: 'Practice a short conversation',
        children: <ConversationPracticePreview />,
      },
    ],
  },
  {
    id: 'further-along',
    title: 'Further along in the transitivity section...',
    blocks: [
      {
        id: 'further-along-placeholder',
        kind: 'text',
        paragraphs: [
          'After a learner sees the first classification card, the notebook can keep moving into another explanation, another activity, or a short recap in one continuous scroll.',
          'The middle and right mockup panels are treated as moments in this same lesson progression, so this route intentionally remains a single grammar preview screen.',
        ],
      },
    ],
  },
  {
    id: 'next-section',
    title: 'Next section...',
    blocks: [
      {
        id: 'next-section-placeholder',
        kind: 'text',
        paragraphs: [
          'Next explanation... more activities... The user continues scrolling through the notebook instead of jumping between screens.',
        ],
      },
    ],
  },
  {
    id: 'continued-scroll',
    title: 'User continues scrolling',
    blocks: [
      {
        id: 'continued-scroll-placeholder',
        kind: 'text',
        paragraphs: [
          'More content can be added here later: quick checks, mini-dialogues, summaries, or review prompts. This preview only proves the long-form lesson shell.',
        ],
      },
    ],
  },
];

export default function GrammarPreviewRoute() {
  return (
    <LessonLayout
      backAccessibilityLabel="Return to lesson previews"
      eyebrow="Grammar preview"
      introduction={[
        'A static notebook preview with placeholder grammar explanations, a nonfunctional classification card, and follow-on sections in one continuous scroll.',
      ]}
      onBack={() => router.replace('/')}
      sections={grammarPreviewSections}
      title="Grammar notebook"
    />
  );
}
