import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { palette, radii, spacing } from '@/styles/theme';

import { AppText } from './AppText';

type ActivityCardProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  style?: StyleProp<ViewStyle>;
};

export function ActivityCard({ children, title, eyebrow, style }: ActivityCardProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={[styles.card, isCompact ? styles.cardCompact : null, style]}>
      {eyebrow ? <AppText variant="caption">{eyebrow}</AppText> : null}
      {title ? <AppText variant="sectionHeading">{title}</AppText> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardCompact: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
});
