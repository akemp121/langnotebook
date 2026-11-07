import { StyleSheet, View } from 'react-native';

import { ActivityCard } from '@/components/ActivityCard';
import { AppText } from '@/components/AppText';
import { DarkButton } from '@/components/DarkButton';
import { ScreenShell } from '@/components/ScreenShell';
import { palette, spacing } from '@/styles/theme';

export default function LessonListRoute() {
  return (
    <ScreenShell>
      <View style={styles.header}>
        <AppText variant="caption">LangNotebook</AppText>
        <AppText variant="heading">Lessons as interactive notebooks</AppText>
        <AppText variant="bodyLarge" style={styles.description}>
          A clean foundation is ready for notebook-style language lessons: wide white space, rounded activity
          cards, dark controls, Michroma headings, and Roboto lesson text.
        </AppText>
      </View>

      <ActivityCard eyebrow="Visual system" title="Notebook activity card">
        <AppText>
          Explanations will flow into lightweight practice cards like this one, keeping the lesson calm and
          readable on small screens.
        </AppText>
        <AppText variant="target">hola · gracias · hasta luego</AppText>
        <DarkButton label="Preview button" accessibilityLabel="Preview dark button" />
      </ActivityCard>

      <View style={styles.note}>
        <AppText variant="sectionHeading">Shared primitives</AppText>
        <AppText style={styles.description}>
          Reusable typography, activity cards, and buttons now share the same spacing, color, radius, and font
          tokens for upcoming lesson previews.
        </AppText>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  description: {
    color: palette.mutedText,
  },
  note: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
