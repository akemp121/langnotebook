import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LessonLayout, type LessonSection } from '@/components/LessonLayout';

const grammarPreviewSections: readonly LessonSection[] = [
  {
    id: 'grammar-shell',
    title: 'Grammar layout placeholder',
    blocks: [
      {
        id: 'grammar-shell-intro',
        kind: 'text',
        paragraphs: [
          'This placeholder reserves the notebook shell for a grammar preview. It shows where explanatory text and activity cards will alternate without adding lesson content yet.',
        ],
      },
      {
        id: 'grammar-shell-card',
        kind: 'activity',
        eyebrow: 'Static preview',
        title: 'Practice card area',
        children: (
          <View>
            <AppText>Future grammar practice will appear here as a nonfunctional classification preview.</AppText>
          </View>
        ),
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
        'A minimal entry point for the grammar notebook layout. Content is static and limited to shell structure.',
      ]}
      onBack={() => router.replace('/')}
      sections={grammarPreviewSections}
      title="Grammar notebook shell"
    />
  );
}
