import type { Curriculum, Lesson } from '../types/curriculum';

export type CurriculumRegistration = {
  curriculum: Curriculum;
  lessons: readonly Lesson[];
};

export type CurriculumCatalog = {
  /** Curricula in registration order; lessons follow each curriculum's lessonIds. */
  readonly curricula: readonly Curriculum[];
  getCurriculum: (curriculumId: string) => Curriculum | undefined;
  getLesson: (curriculumId: string, lessonId: string) => Lesson | undefined;
  getLessons: (curriculumId: string) => readonly Lesson[] | undefined;
};

/** Validate bundled authoring mistakes eagerly; ordinary lookup misses return undefined. */
export function createCurriculumCatalog(
  registrations: readonly CurriculumRegistration[],
): CurriculumCatalog {
  const curricula = new Map<string, Curriculum>();
  const lessonsByCurriculum = new Map<string, ReadonlyMap<string, Lesson>>();
  const orderedLessons = new Map<string, readonly Lesson[]>();

  for (const { curriculum, lessons } of registrations) {
    const curriculumId = curriculum.id;
    if (curricula.has(curriculumId)) {
      throw new Error(`Duplicate curriculum ID "${curriculumId}".`);
    }

    const lessonMap = new Map<string, Lesson>();
    for (const lesson of lessons) {
      if (lessonMap.has(lesson.id)) {
        throw new Error(`Duplicate lesson ID "${lesson.id}" in curriculum "${curriculumId}".`);
      }
      lessonMap.set(lesson.id, lesson);
    }

    const referencedIds = new Set<string>();
    const ordered: Lesson[] = [];
    for (const lessonId of curriculum.lessonIds) {
      if (referencedIds.has(lessonId)) {
        throw new Error(`Duplicate lesson reference "${lessonId}" in curriculum "${curriculumId}".`);
      }
      const lesson = lessonMap.get(lessonId);
      if (!lesson) {
        throw new Error(`Curriculum "${curriculumId}" references missing lesson "${lessonId}".`);
      }
      referencedIds.add(lessonId);
      ordered.push(lesson);
    }

    for (const lessonId of lessonMap.keys()) {
      if (!referencedIds.has(lessonId)) {
        throw new Error(`Lesson "${lessonId}" is not listed in curriculum "${curriculumId}" lessonIds.`);
      }
    }

    curricula.set(curriculumId, curriculum);
    lessonsByCurriculum.set(curriculumId, lessonMap);
    orderedLessons.set(curriculumId, Object.freeze(ordered));
  }

  return {
    curricula: Object.freeze([...curricula.values()]),
    getCurriculum: (curriculumId) => curricula.get(curriculumId),
    getLesson: (curriculumId, lessonId) => lessonsByCurriculum.get(curriculumId)?.get(lessonId),
    getLessons: (curriculumId) => orderedLessons.get(curriculumId),
  };
}
