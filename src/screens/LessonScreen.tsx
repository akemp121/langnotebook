import { AppText } from '@/components/AppText';
import { DarkButton } from '@/components/DarkButton';
import { LessonLayout } from '@/components/LessonLayout';
import { ScreenShell } from '@/components/ScreenShell';
import { curriculumCatalog } from '@/data/curriculumCatalog';
import { useLessonBackNavigation } from '@/hooks/useLessonBackNavigation';

type LessonScreenProps = {
  curriculumId: string | undefined;
  lessonId: string | undefined;
};

export function LessonScreen({ curriculumId, lessonId }: LessonScreenProps) {
  const returnToLessonList = useLessonBackNavigation();
  const lesson = curriculumId && lessonId
    ? curriculumCatalog.getLesson(curriculumId, lessonId)
    : undefined;

  if (!lesson) {
    return (
      <ScreenShell>
        <AppText variant="heading">Lesson not found</AppText>
        <AppText>
          This lesson is not available. Return to the lesson previews to choose another lesson.
        </AppText>
        <DarkButton label="Return to lesson previews" onPress={returnToLessonList} />
      </ScreenShell>
    );
  }

  return (
    <LessonLayout
      {...lesson}
      backAccessibilityLabel="Return to lesson previews"
      onBack={returnToLessonList}
    />
  );
}
