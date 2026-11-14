import type { ReactNode } from 'react';

/** A BCP 47 language tag, with optional writing-system and variety metadata. */
export type CurriculumLanguage = {
  tag: string;
  /** ISO 15924 script code, for example Latn. Metadata does not imply font support. */
  script?: string;
  /** Optional descriptive variety, for example Mexican Spanish. */
  dialect?: string;
};

export type Curriculum = {
  /** Stable, explicit ID, unique across curricula; never generated from a title. */
  id: string;
  title: string;
  instructionLanguage: CurriculumLanguage;
  targetLanguage: CurriculumLanguage;
  /** Lesson IDs in display order, scoped to this curriculum. */
  lessonIds: readonly string[];
};

export type LessonTextBlock = {
  /** Stable ID, unique within its section. */
  id: string;
  kind: 'text';
  paragraphs: readonly string[];
};

export type LessonActivityBlock = {
  /** Stable ID, unique within its section. */
  id: string;
  kind: 'activity';
  children: ReactNode;
  eyebrow?: string;
  title?: string;
};

export type LessonBlock = LessonTextBlock | LessonActivityBlock;

export type LessonSection = {
  /** Stable ID, unique within its lesson. */
  id: string;
  blocks: readonly LessonBlock[];
  title: string;
};

/** Optional list-card copy; lessons without it use their title and introduction. */
export type LessonListDisplay = {
  title: string;
  eyebrow: string;
  summary: string;
  layoutNote: string;
  estimatedLength: string;
};

export type Lesson = {
  /** Stable, explicit ID, unique within its curriculum; independent of title/order. */
  id: string;
  title: string;
  listDisplay?: LessonListDisplay;
  eyebrow?: string;
  introduction?: readonly string[];
  sections: readonly LessonSection[];
};
