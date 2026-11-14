import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, radii, spacing } from '@/styles/theme';

export type AlphabetExampleWord = {
  readonly id: string;
  readonly label: string;
};

export type AlphabetLetterPreview = {
  readonly id: string;
  readonly letter: string;
  readonly pronunciationHint: string;
  readonly examples: readonly AlphabetExampleWord[];
};

export type AlphabetPreviewProps = {
  readonly letters: readonly AlphabetLetterPreview[];
};

export function AlphabetPreview({ letters }: AlphabetPreviewProps) {
  return (
    <View style={styles.container}>
      {letters.map((letterPreview) => (
        <LetterCard key={letterPreview.id} letterPreview={letterPreview} />
      ))}
    </View>
  );
}

type LetterCardProps = {
  readonly letterPreview: AlphabetLetterPreview;
};

function LetterCard({ letterPreview }: LetterCardProps) {
  return (
    <View style={styles.letterCard}>
      <View style={styles.letterHeader}>
        <StaticAudioButton
          accessibilityLabel={`Preview pronunciation audio for the letter ${letterPreview.letter}`}
          iconOnly
          label="🔊"
        />

        <AppText variant="target" style={styles.letterText}>
          {letterPreview.letter}
        </AppText>

        <AppText style={styles.pronunciationHint}>{letterPreview.pronunciationHint}</AppText>
      </View>

      <View style={styles.exampleRow}>
        {letterPreview.examples.map((example) => (
          <ExampleAudioButton key={example.id} example={example} />
        ))}
      </View>
    </View>
  );
}

type ExampleAudioButtonProps = {
  readonly example: AlphabetExampleWord;
};

function ExampleAudioButton({ example }: ExampleAudioButtonProps) {
  return <StaticAudioButton accessibilityLabel={`Preview audio for ${example.label}`} label={example.label} />;
}

type StaticAudioButtonProps = {
  readonly accessibilityLabel: string;
  readonly label: string;
  readonly iconOnly?: boolean;
};

function StaticAudioButton({ accessibilityLabel, label, iconOnly = false }: StaticAudioButtonProps) {
  return (
    <Pressable
      accessibilityHint="Static preview only; audio playback is not implemented."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={iconOnly ? styles.speakerButton : styles.exampleButton}
    >
      <AppText style={iconOnly ? styles.speakerButtonText : styles.exampleButtonText}>
        {iconOnly ? label : `🔊  ${label}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  letterCard: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  letterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  speakerButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  speakerButtonText: {
    fontSize: 22,
    lineHeight: 26,
  },
  letterText: {
    fontSize: 40,
    lineHeight: 46,
    minWidth: 42,
  },
  pronunciationHint: {
    color: palette.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 140,
    textAlign: 'right',
  },
  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exampleButton: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  exampleButtonText: {
    color: palette.buttonText,
    fontSize: 14,
    lineHeight: 18,
  },
});
