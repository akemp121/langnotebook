import { syntheticToneRegistration } from '../fixtures/toneCurriculum';
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

const previewRegistration = {
  curriculum: previewCurriculum,
  lessons: [alphabetPreviewLesson, grammarPreviewLesson],
};

/** Learner-facing list stays limited to the original shell previews. */
export const lessonListCatalog = createCurriculumCatalog([previewRegistration]);

/** Direct routes also resolve the explicitly labeled, route-only development fixture. */
export const curriculumCatalog = createCurriculumCatalog([
  previewRegistration,
  syntheticToneRegistration,
]);
