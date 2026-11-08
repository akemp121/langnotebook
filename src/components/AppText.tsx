import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { fonts, palette } from '@/styles/theme';

type AppTextVariant = 'body' | 'bodyLarge' | 'caption' | 'target' | 'heading' | 'sectionHeading' | 'button';

type AppTextProps = {
  children: ReactNode;
  variant?: AppTextVariant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
  maxFontSizeMultiplier?: number;
};

const defaultMaxFontSizeMultiplier: Record<AppTextVariant, number> = {
  body: 1.8,
  bodyLarge: 1.7,
  caption: 1.6,
  target: 1.7,
  heading: 1.35,
  sectionHeading: 1.45,
  button: 1.5,
};

export function AppText({
  children,
  variant = 'body',
  style,
  numberOfLines,
  accessibilityLabel,
  maxFontSizeMultiplier,
}: AppTextProps) {
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? defaultMaxFontSizeMultiplier[variant]}
      numberOfLines={numberOfLines}
      style={[styles[variant], style]}
      textBreakStrategy="balanced"
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    color: palette.text,
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
  bodyLarge: {
    color: palette.text,
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 29,
  },
  caption: {
    color: palette.mutedText,
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  target: {
    color: palette.text,
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 20,
    lineHeight: 30,
  },
  heading: {
    color: palette.text,
    flexShrink: 1,
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 42,
  },
  sectionHeading: {
    color: palette.text,
    flexShrink: 1,
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 32,
  },
  button: {
    color: palette.buttonText,
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
