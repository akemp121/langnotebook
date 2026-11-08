import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, radii, spacing } from '@/styles/theme';

type AnswerChoice = {
  readonly id: string;
  readonly label: string;
};

const answerChoices: readonly AnswerChoice[] = [
  { id: 'transitive', label: 'Transitive' },
  { id: 'intransitive', label: 'Intransitive' },
] as const;

export function ClassificationPracticePreview() {
  return (
    <View style={styles.container}>
      <AppText variant="caption">Preview only</AppText>

      <View style={styles.navigationRow}>
        <StaticArrowButton accessibilityLabel="Previous preview question" label="‹" />
        <AppText style={styles.counterText}>1/10</AppText>
        <StaticArrowButton accessibilityLabel="Next preview question" label="›" />
      </View>

      <View style={styles.promptGroup}>
        <AppText variant="target" style={styles.promptText}>
          to run
        </AppText>
        <AppText style={styles.promptHint}>Classify whether the sample verb needs an object.</AppText>
      </View>

      <View style={styles.answerRow}>
        {answerChoices.map((choice) => (
          <StaticAnswerButton key={choice.id} label={choice.label} />
        ))}
      </View>
    </View>
  );
}

type StaticArrowButtonProps = {
  readonly accessibilityLabel: string;
  readonly label: string;
};

function StaticArrowButton({ accessibilityLabel, label }: StaticArrowButtonProps) {
  return (
    <Pressable
      accessibilityHint="Static preview only; question navigation is not implemented."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={styles.arrowButton}
    >
      <AppText style={styles.arrowText}>{label}</AppText>
    </Pressable>
  );
}

type StaticAnswerButtonProps = {
  readonly label: string;
};

function StaticAnswerButton({ label }: StaticAnswerButtonProps) {
  return (
    <Pressable
      accessibilityHint="Static preview only; answer checking is not implemented."
      accessibilityLabel={`Preview answer: ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={styles.answerButton}
    >
      <AppText variant="button" style={styles.answerButtonText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  navigationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arrowButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  arrowText: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 34,
  },
  counterText: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
  },
  promptGroup: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  promptText: {
    textAlign: 'center',
  },
  promptHint: {
    color: palette.mutedText,
    textAlign: 'center',
  },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  answerButton: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: radii.sm,
    flex: 1,
    minHeight: 48,
    minWidth: 132,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  answerButtonText: {
    textAlign: 'center',
  },
});
