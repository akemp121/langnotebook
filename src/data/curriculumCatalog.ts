import { alphabetPreviewLesson } from '../lessons/alphabet';
import { grammarPreviewLesson } from '../lessons/grammar';
import type { Curriculum } from '../types/curriculum';
import { createCurriculumCatalog } from './createCurriculumCatalog';

/** UI-shell examples, not a completed or sourced Spanish curriculum. */
export const previewCurriculum: Curriculum = {
  id: 'notebook-preview',
  title: 'Notebook previews',
  instructionLanguage: { tag: 'en', script: 'Latn' },
  targetLanguage: { tag: 'es', script: 'Latn' },
  lessonIds: ['alphabet', 'grammar'],
};

export const curriculumCatalog = createCurriculumCatalog([
  {
    curriculum: previewCurriculum,
    lessons: [alphabetPreviewLesson, grammarPreviewLesson],
  },
]);
