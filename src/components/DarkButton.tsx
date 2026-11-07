import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { palette, radii, spacing } from '@/styles/theme';

import { AppText } from './AppText';

type DarkButtonProps = {
  label: string;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DarkButton({ label, onPress, accessibilityLabel, disabled = false, style }: DarkButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <AppText variant="button">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.button,
    borderRadius: radii.md,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    backgroundColor: palette.buttonPressed,
    transform: [{ scale: 0.98 }],
  },
});
