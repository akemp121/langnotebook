import { LessonLayout } from '@/components/LessonLayout';
import { useLessonBackNavigation } from '@/hooks/useLessonBackNavigation';
import { alphabetPreviewLesson } from '@/lessons/alphabet';

export default function AlphabetPreviewRoute() {
  const returnToLessonList = useLessonBackNavigation();

  return (
    <LessonLayout
      {...alphabetPreviewLesson}
      backAccessibilityLabel="Return to lesson previews"
      onBack={returnToLessonList}
    />
  );
}
