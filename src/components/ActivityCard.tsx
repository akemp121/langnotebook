import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { palette, radii, spacing } from '@/styles/theme';

import { AppText } from './AppText';

type ActivityCardProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  style?: StyleProp<ViewStyle>;
};

export function ActivityCard({ children, title, eyebrow, style }: ActivityCardProps) {
  return (
    <View style={[styles.card, style]}>
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
  content: {
    gap: spacing.md,
  },
});
