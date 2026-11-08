import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { palette, radii, spacing } from '@/styles/theme';

type ConversationTurn = {
  readonly speaker: string;
  readonly targetText: string;
  readonly translation: string;
};

type ConversationPracticePrompt = {
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly instruction: string;
  readonly turns: readonly ConversationTurn[];
};

const previewPrompt: ConversationPracticePrompt = {
  questionNumber: 1,
  totalQuestions: 8,
  instruction: 'Listen to the situation, then practice answering out loud in the target language.',
  turns: [
    {
      speaker: 'Tutor',
      targetText: '¿Adónde vas?',
      translation: 'Where are you going?',
    },
    {
      speaker: 'Learner',
      targetText: 'Voy al mercado.',
      translation: 'I am going to the market.',
    },
  ],
} as const;

export function ConversationPracticePreview() {
  const counterLabel = `${previewPrompt.questionNumber}/${previewPrompt.totalQuestions}`;

  return (
    <View style={styles.container}>
      <View style={styles.previewBanner}>
        <AppText variant="caption" style={styles.previewEyebrow}>
          Preview only
        </AppText>
        <AppText style={styles.previewNote}>
          Static UI shell: recording, transcription, AI responses, and submission are not implemented.
        </AppText>
      </View>

      <View style={styles.navigationRow}>
        <StaticArrowButton accessibilityLabel="Previous conversation prompt" label="‹" />
        <AppText
          accessibilityLabel={`Question ${previewPrompt.questionNumber} of ${previewPrompt.totalQuestions}`}
          style={styles.counterText}
        >
          {counterLabel}
        </AppText>
        <StaticArrowButton accessibilityLabel="Next conversation prompt" label="›" />
      </View>

      <AppText style={styles.instructionText}>{previewPrompt.instruction}</AppText>

      <View style={styles.dialogueCard}>
        {previewPrompt.turns.map((turn) => (
          <View key={turn.speaker} style={styles.dialogueTurn}>
            <AppText variant="caption" style={styles.speakerLabel}>
              {turn.speaker}
            </AppText>
            <AppText variant="target" style={styles.targetText}>
              {turn.targetText}
            </AppText>
            <AppText style={styles.translationText}>{turn.translation}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.microphoneWrap}>
        <View
          accessibilityLabel="Microphone preview icon; recording is not implemented."
          accessibilityRole="image"
          style={styles.microphoneCircle}
        >
          <AppText style={styles.microphoneIcon}>🎙</AppText>
        </View>
        <AppText style={styles.microphoneHint}>Tap-to-record placeholder</AppText>
      </View>

      <View style={styles.buttonRow}>
        <StaticActionButton accessibilityLabel="Ask question preview button" label="Ask question" />
        <StaticActionButton accessibilityLabel="Submit answer preview button" label="Submit" />
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
      accessibilityHint="Static preview only; conversation prompt navigation is not implemented."
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

type StaticActionButtonProps = {
  readonly accessibilityLabel: string;
  readonly label: string;
};

function StaticActionButton({ accessibilityLabel, label }: StaticActionButtonProps) {
  return (
    <Pressable
      accessibilityHint="Static preview only; this action is not implemented."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={styles.actionButton}
    >
      <AppText variant="button" style={styles.actionButtonText}>
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
  instructionText: {
    color: palette.mutedText,
    textAlign: 'center',
  },
  dialogueCard: {
    backgroundColor: palette.cardElevated,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  dialogueTurn: {
    gap: spacing.xs,
  },
  speakerLabel: {
    color: palette.subtleText,
  },
  targetText: {
    color: palette.text,
  },
  translationText: {
    color: palette.mutedText,
  },
  microphoneWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  microphoneCircle: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: radii.pill,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  microphoneIcon: {
    fontSize: 34,
    lineHeight: 40,
  },
  microphoneHint: {
    color: palette.subtleText,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
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
  actionButtonText: {
    textAlign: 'center',
  },
});
