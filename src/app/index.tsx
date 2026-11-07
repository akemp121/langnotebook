import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { palette, radii, spacing } from '@/styles/theme';

export default function LessonListRoute() {
  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>LangNotebook</Text>
        <Text style={styles.title}>Lessons as interactive notebooks</Text>
        <Text style={styles.description}>
          Expo Router is ready. Upcoming tasks will add lesson previews and wire navigation from this list.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route setup complete</Text>
        <Text style={styles.cardText}>
          Screens live under src/app, while reusable components and styling live outside the route directory.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  eyebrow: {
    color: palette.mutedText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
  },
  description: {
    color: palette.mutedText,
    fontSize: 17,
    lineHeight: 26,
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  cardText: {
    color: palette.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
});
