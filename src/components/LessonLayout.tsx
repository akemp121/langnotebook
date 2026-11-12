import type { PressableProps } from 'react-native';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radii, spacing } from '@/styles/theme';
import type { Lesson, LessonBlock } from '@/types/curriculum';

import { ActivityCard } from './ActivityCard';
import { AppText } from './AppText';

type LessonLayoutProps = Pick<Lesson, 'sections' | 'title' | 'eyebrow' | 'introduction'> & {
  onBack: NonNullable<PressableProps['onPress']>;
  backAccessibilityLabel?: string;
};

export function LessonLayout({
  onBack,
  sections,
  title,
  backAccessibilityLabel = 'Go back to lessons',
  eyebrow,
  introduction,
}: LessonLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const horizontalPadding = isCompact ? spacing.md : width >= 768 ? spacing.xxl : spacing.lg;

  return (
    <View style={styles.safeAreaBackground}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + spacing.xxl, spacing.xxxl),
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(insets.top + (isCompact ? spacing.sm : spacing.md), isCompact ? spacing.lg : spacing.xl),
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom, top: insets.top }}
        style={styles.scrollView}
      >
        <View style={[styles.content, isCompact ? styles.contentCompact : null]}>
          <View style={[styles.header, isCompact ? styles.headerCompact : null]}>
            <Pressable
              accessibilityLabel={backAccessibilityLabel}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
            >
              <AppText style={styles.backButtonText}>‹</AppText>
            </Pressable>

            <View style={styles.titleGroup}>
              {eyebrow ? <AppText variant="caption">{eyebrow}</AppText> : null}
              <AppText variant="heading">{title}</AppText>
              {introduction ? (
                <View style={styles.paragraphGroup}>
                  {introduction.map((paragraph) => (
                    <AppText key={paragraph} variant="bodyLarge" style={styles.mutedText}>
                      {paragraph}
                    </AppText>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.sections}>
            {sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <AppText variant="sectionHeading" style={[styles.sectionHeading, isCompact ? styles.sectionHeadingCompact : null]}>
                  {section.title}
                </AppText>
                <View style={styles.blocks}>{section.blocks.map(renderBlock)}</View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function renderBlock(block: LessonBlock) {
  if (block.kind === 'activity') {
    return (
      <ActivityCard key={block.id} eyebrow={block.eyebrow} title={block.title}>
        {block.children}
      </ActivityCard>
    );
  }

  return (
    <View key={block.id} style={styles.paragraphGroup}>
      {block.paragraphs.map((paragraph) => (
        <AppText key={paragraph} variant="bodyLarge">
          {paragraph}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaBackground: {
    backgroundColor: palette.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.xxl,
    maxWidth: 760,
    width: '100%',
  },
  contentCompact: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.lg,
  },
  headerCompact: {
    gap: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  backButtonPressed: {
    backgroundColor: palette.buttonPressed,
    transform: [{ scale: 0.96 }],
  },
  backButtonText: {
    color: palette.buttonText,
    fontSize: 34,
    lineHeight: 38,
    marginTop: -3,
  },
  titleGroup: {
    gap: spacing.md,
  },
  mutedText: {
    color: palette.mutedText,
  },
  sections: {
    gap: spacing.xxxl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeading: {
    fontSize: 24,
    lineHeight: 35,
  },
  sectionHeadingCompact: {
    fontSize: 21,
    lineHeight: 31,
  },
  blocks: {
    gap: spacing.xl,
  },
  paragraphGroup: {
    gap: spacing.md,
  },
});
