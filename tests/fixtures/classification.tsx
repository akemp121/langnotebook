import { ClassificationPracticePreview } from '@/components/ClassificationPracticePreview';

// Synthetic UI fixture only, not curriculum content or a main-list lesson.
export const threeCategoryPreview = (
  <ClassificationPracticePreview
    questionNumber={3}
    totalQuestions={7}
    prompt="Synthetic symbol: △"
    instruction="Classify this symbol by its number of sides."
    choices={[
      { id: 'round', label: 'No straight sides' },
      { id: 'triangle', label: 'Three sides' },
      { id: 'quadrilateral', label: 'Four sides' },
    ]}
  />
);
