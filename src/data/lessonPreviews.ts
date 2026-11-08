import type { Href } from 'expo-router';

export type LessonPreviewId = 'alphabet' | 'grammar-notebook';

export type LessonPreview = {
  id: LessonPreviewId;
  title: string;
  eyebrow: string;
  summary: string;
  layoutNote: string;
  estimatedLength: string;
  href: Href;
};

export const lessonPreviews: readonly LessonPreview[] = [
  {
    id: 'alphabet',
    title: 'Alphabet preview',
    eyebrow: 'Notebook shell',
    summary: 'A static entry for the alphabet layout: letter cards, pronunciation hints, and audio controls later.',
    layoutNote: 'Explainer text → letter activity card → short reflection text',
    estimatedLength: 'Preview only',
    href: './lessons/alphabet',
  },
  {
    id: 'grammar-notebook',
    title: 'Grammar notebook preview',
    eyebrow: 'Notebook shell',
    summary: 'A static entry for the grammar layout: concise explanations and practice cards in one scroll later.',
    layoutNote: 'Concept text → classification practice card → follow-on sections',
    estimatedLength: 'Preview only',
    href: './lessons/grammar',
  },
] as const;
