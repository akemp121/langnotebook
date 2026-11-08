import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LessonLayout, type LessonSection } from '@/components/LessonLayout';

const alphabetPreviewSections: readonly LessonSection[] = [
  {
    id: 'alphabet-shell',
    title: 'Alphabet layout placeholder',
    blocks: [
      {
        id: 'alphabet-shell-intro',
        kind: 'text',
        paragraphs: [
          'This placeholder reserves the notebook shell for the alphabet preview. It intentionally avoids teaching a real alphabet sequence until the preview activity is built.',
        ],
      },
      {
        id: 'alphabet-shell-card',
        kind: 'activity',
        eyebrow: 'Static preview',
        title: 'Letter card area',
        children: (
          <View>
            <AppText>Future alphabet cards will appear here with sample letters and nonfunctional audio controls.</AppText>
          </View>
        ),
      },
    ],
  },
];

export default function AlphabetPreviewRoute() {
  return (
    <LessonLayout
      backAccessibilityLabel="Return to lesson previews"
      eyebrow="Alphabet preview"
      introduction={[
        'A minimal entry point for the alphabet notebook layout. Content is static and limited to shell structure.',
      ]}
      onBack={() => router.replace('/')}
      sections={alphabetPreviewSections}
      title="Alphabet notebook shell"
    />
  );
}
