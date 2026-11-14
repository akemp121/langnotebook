import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, radii, spacing } from '@/styles/theme';

export type ClassificationChoice = {
  readonly id: string;
  readonly label: string;
};

export type ClassificationPracticePreviewProps = {
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly prompt: string;
  readonly instruction: string;
  readonly choices: readonly ClassificationChoice[];
};

export function ClassificationPracticePreview({
  questionNumber,
  totalQuestions,
  prompt,
  instruction,
  choices,
}: ClassificationPracticePreviewProps) {
  const counterLabel = `${questionNumber}/${totalQuestions}`;

  return (
    <View style={styles.container}>
      <View style={styles.previewBanner}>
        <AppText variant="caption" style={styles.previewEyebrow}>
          Preview only
        </AppText>
        <AppText style={styles.previewNote}>
          Static UI shell: question advancement, answer checking, scoring, and feedback are not implemented.
        </AppText>
      </View>

      <View style={styles.navigationRow}>
        <StaticArrowButton accessibilityLabel="Previous preview question" label="‹" />
        <AppText
          accessibilityLabel={`Question ${questionNumber} of ${totalQuestions}`}
          style={styles.counterText}
        >
          {counterLabel}
        </AppText>
        <StaticArrowButton accessibilityLabel="Next preview question" label="›" />
      </View>

      <View style={styles.promptGroup}>
        <AppText variant="target" style={styles.promptText}>
          {prompt}
        </AppText>
        <AppText style={styles.promptHint}>{instruction}</AppText>
      </View>

      <View style={styles.answerRow}>
        {choices.map((choice) => (
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
  previewBanner: {
    backgroundColor: palette.cardElevated,
    borderColor: palette.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  previewEyebrow: {
    color: palette.text,
  },
  previewNote: {
    color: palette.mutedText,
  },
  navigationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  arrowButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  arrowText: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 34,
  },
  counterText: {
    color: palette.text,
    flexShrink: 0,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
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
