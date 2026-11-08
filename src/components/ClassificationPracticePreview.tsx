import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, radii, spacing } from '@/styles/theme';

type AnswerChoice = {
  readonly id: 'transitive' | 'intransitive';
  readonly label: string;
};

type ClassificationPrompt = {
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly prompt: string;
  readonly instruction: string;
  readonly answers: readonly AnswerChoice[];
};

const previewPrompt: ClassificationPrompt = {
  questionNumber: 1,
  totalQuestions: 10,
  prompt: 'The child reads a book.',
  instruction: 'Classify whether the highlighted action points toward an object.',
  answers: [
    { id: 'transitive', label: 'Transitive' },
    { id: 'intransitive', label: 'Intransitive' },
  ],
} as const;

export function ClassificationPracticePreview() {
  const counterLabel = `${previewPrompt.questionNumber}/${previewPrompt.totalQuestions}`;

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
          accessibilityLabel={`Question ${previewPrompt.questionNumber} of ${previewPrompt.totalQuestions}`}
          style={styles.counterText}
        >
          {counterLabel}
        </AppText>
        <StaticArrowButton accessibilityLabel="Next preview question" label="›" />
      </View>

      <View style={styles.promptGroup}>
        <AppText variant="target" style={styles.promptText}>
          {previewPrompt.prompt}
        </AppText>
        <AppText style={styles.promptHint}>{previewPrompt.instruction}</AppText>
      </View>

      <View style={styles.answerRow}>
        {previewPrompt.answers.map((choice) => (
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
