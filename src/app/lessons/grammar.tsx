import { LessonLayout } from '@/components/LessonLayout';
import { useLessonBackNavigation } from '@/hooks/useLessonBackNavigation';
import { grammarPreviewLesson } from '@/lessons/grammar';

export default function GrammarPreviewRoute() {
  const returnToLessonList = useLessonBackNavigation();

  return (
    <LessonLayout
      {...grammarPreviewLesson}
      backAccessibilityLabel="Return to lesson previews"
      onBack={returnToLessonList}
    />
  );
}
