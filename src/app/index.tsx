import { Link } from 'expo-router';
import { forwardRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { ScreenShell } from '@/components/ScreenShell';
import { lessonPreviews, type LessonPreview } from '@/data/lessonPreviews';
import { palette, radii, spacing } from '@/styles/theme';

export default function LessonSelectionRoute() {
  return (
    <ScreenShell>
      <View style={styles.header}>
        <AppText variant="caption">LangNotebook</AppText>
        <AppText variant="heading">Choose a notebook preview</AppText>
        <AppText variant="bodyLarge" style={styles.description}>
          Start with one of the static shell layouts below. These entries only preview navigation and structure; they
          do not introduce a curriculum, progress tracking, or real activities yet.
        </AppText>
      </View>

      <View style={styles.previewList}>
        {lessonPreviews.map((preview) => (
          <LessonPreviewCard key={preview.id} preview={preview} />
        ))}
      </View>
    </ScreenShell>
  );
}

type LessonPreviewCardProps = {
  preview: LessonPreview;
};

// Keep the style callback inside the component: Link's slot merges style props
// as objects, which would otherwise discard the Pressable callback's styles.
const PreviewCardPressable = forwardRef<ComponentRef<typeof Pressable>, PressableProps>(function PreviewCardPressable(
  { style, ...props },
  ref,
) {
  return (
    <Pressable
      {...props}
      ref={ref}
      style={(state) => [
        styles.previewCard,
        typeof style === 'function' ? style(state) : style,
        state.pressed ? styles.previewCardPressed : null,
      ]}
    />
  );
});

function LessonPreviewCard({ preview }: LessonPreviewCardProps) {
  return (
    <Link href={preview.href} asChild>
      <PreviewCardPressable
        accessibilityHint={`Opens the ${preview.title.toLowerCase()} shell`}
        accessibilityLabel={preview.title}
        accessibilityRole="link"
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <AppText variant="caption">{preview.eyebrow}</AppText>
            <AppText variant="sectionHeading">{preview.title}</AppText>
          </View>
          <View style={styles.statusPill}>
            <AppText style={styles.statusText}>{preview.estimatedLength}</AppText>
          </View>
        </View>

        <AppText variant="bodyLarge" style={styles.description}>
          {preview.summary}
        </AppText>

        <View style={styles.layoutNote}>
          <AppText variant="caption">Layout</AppText>
          <AppText>{preview.layoutNote}</AppText>
        </View>

        <View style={styles.actionRow}>
          <AppText style={styles.actionText}>Open shell</AppText>
          <AppText style={styles.actionArrow}>→</AppText>
        </View>
      </PreviewCardPressable>
    </Link>
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
  previewList: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  previewCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.lg,
    minHeight: 220,
    padding: spacing.lg,
  },
  previewCardPressed: {
    backgroundColor: palette.cardElevated,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: spacing.sm,
  },
  statusPill: {
    backgroundColor: palette.button,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: palette.buttonText,
    fontSize: 13,
    lineHeight: 18,
  },
  layoutNote: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  actionRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.button,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionText: {
    color: palette.buttonText,
  },
  actionArrow: {
    color: palette.buttonText,
    fontSize: 18,
    lineHeight: 22,
  },
});
