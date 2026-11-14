import { useLocalSearchParams } from 'expo-router';

import { LessonScreen } from '@/screens/LessonScreen';

export default function CatalogLessonRoute() {
  const { curriculumId, lessonId } = useLocalSearchParams<{
    curriculumId?: string | string[];
    lessonId?: string | string[];
  }>();

  return (
    <LessonScreen
      curriculumId={typeof curriculumId === 'string' ? curriculumId : undefined}
      lessonId={typeof lessonId === 'string' ? lessonId : undefined}
    />
  );
}
