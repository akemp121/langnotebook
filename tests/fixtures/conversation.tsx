import { ConversationPracticePreview } from '@/components/ConversationPracticePreview';

// Synthetic French/German UI fixture only, not curriculum content or a main-list lesson.
export const syntheticConversationPreview = (
  <ConversationPracticePreview
    questionNumber={4}
    totalQuestions={6}
    instruction="Synthetic preview: read the French dialogue with German translations."
    languageContext={{ targetLanguage: 'French', translationLanguage: 'German' }}
    turns={[
      {
        id: 'guide-greeting',
        speaker: 'Guide',
        targetText: 'Bonjour !',
        translation: 'Guten Tag!',
      },
      {
        id: 'visitor-greeting',
        speaker: 'Visitor',
        targetText: 'Salut !',
        translation: 'Hallo!',
      },
      {
        id: 'guide-welcome',
        speaker: 'Guide',
        targetText: 'Bienvenue !',
        translation: 'Willkommen!',
      },
    ]}
  />
);
