import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/styles/theme';

export function LoadingFallback() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>LangNotebook</Text>
      <Text style={styles.message}>Loading lesson fonts…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  eyebrow: {
    color: palette.mutedText,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  message: {
    color: palette.mutedText,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
  },
});
