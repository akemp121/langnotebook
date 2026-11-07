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
};

export function AppText({ children, variant = 'body', style, numberOfLines }: AppTextProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles[variant], style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
  bodyLarge: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 29,
  },
  caption: {
    color: palette.mutedText,
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  target: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 20,
    lineHeight: 30,
  },
  heading: {
    color: palette.text,
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 40,
  },
  sectionHeading: {
    color: palette.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 31,
  },
  button: {
    color: palette.buttonText,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 20,
  },
});
