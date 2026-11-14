import type { Href } from 'expo-router';

import type { LessonListDisplay } from '../types/curriculum';
import type { CurriculumCatalog } from './createCurriculumCatalog';
import { curriculumCatalog } from './curriculumCatalog';

export type LessonPreview = LessonListDisplay & {
  /** Composite identity: lesson IDs are only unique within a curriculum. */
  id: string;
  href: Href;
};

/** Follow catalog order and route every entry through the shared lesson screen. */
export function getLessonPreviews(catalog: CurriculumCatalog): readonly LessonPreview[] {
  return catalog.curricula.flatMap((curriculum) =>
    (catalog.getLessons(curriculum.id) ?? []).map((lesson): LessonPreview => ({
      id: JSON.stringify([curriculum.id, lesson.id]),
      title: lesson.listDisplay?.title ?? lesson.title,
      eyebrow: lesson.listDisplay?.eyebrow ?? curriculum.title,
      summary: lesson.listDisplay?.summary ?? lesson.introduction?.join(' ') ?? '',
      layoutNote: lesson.listDisplay?.layoutNote ?? lesson.sections.map((section) => section.title).join(' → '),
      estimatedLength: lesson.listDisplay?.estimatedLength ?? 'Preview only',
      href: {
        pathname: '/lessons/[curriculumId]/[lessonId]',
        params: { curriculumId: curriculum.id, lessonId: lesson.id },
      },
    })),
  );
}

export const lessonPreviews = getLessonPreviews(curriculumCatalog);
