import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, spacing } from '@/styles/theme';

const paths = [
  { id: 'level', label: 'A · Level', heights: [20, 20, 20, 20, 20] },
  { id: 'rising', label: 'B · Rising', heights: [0, 10, 20, 30, 40] },
  { id: 'falling', label: 'C · Falling', heights: [40, 30, 20, 10, 0] },
] as const;

/** Hand-placed dots only. No measured signal, interaction, or tone evaluation. */
export function StaticToneGraphic() {
  return (
    <View style={styles.figure}>
      <AppText variant="caption">Synthetic pitch paths · static graphic</AppText>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Illustrative pitch paths, not measured audio: A stays level, B rises, C falls."
        style={styles.paths}
      >
        {paths.map((path) => (
          <View key={path.id} style={styles.path}>
            <View style={styles.plot}>
              {path.heights.map((height, index) => (
                <View key={index} style={[styles.dot, { marginBottom: height }]} />
              ))}
            </View>
            <AppText style={styles.label}>{path.label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  figure: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 320,
    width: '100%',
  },
  paths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  path: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 80,
  },
  plot: {
    alignItems: 'flex-end',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
  dot: {
    backgroundColor: palette.text,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  label: {
    textAlign: 'center',
  },
});
