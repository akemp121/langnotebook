# LangNotebook

##### Suggested Framework

Expo (React Native + Expo Router). Mobile-first development with web-app implementation later after MVP is established.

##### Overview

Language learning app with the lessons given in the style of a Jupyter Notebook. It follows the pattern of descriptive text -> interactive bit -> descriptive text -> interactive bit, etc. The app and curriculum is minimalist at its core--teaching the MOST important bits first like alphabet, pronunciation, and basic grammar principles. Vocabulary acquisition is constantly enforced throughout--the most common words in the target language will be incorporated in the lessons. Agents are used to transcribe spoken words/sentences in practices, provide feedback, and more. The app will provide the user ample opportunities to save vocabulary for later practice where they may practiced them in a sort of "spaced review" fashion.

##### Parts

1. Build UI shell and structure. Refer to images in the docs folder for what it should look like more/less. Michroma font will be used for large header and section text, while roboto will be used for any explainer text/target language text (for now until we add languages with different alphabets!). Navigation is the only function that needs to work at this point.

   **1.1. Prepare curriculum extensibility.** Preserve the working shell while separating curricula from routes, making previews configurable, and adding minimal language, activity-state, and service contracts. Prove arbitrary custom activity composition with synthetic fixtures before Spanish curriculum design in part 2; real activities and persistence remain in parts 4–5. See `PLAN1.md` and `ASSESSMENT.md`.

2. Build a curriculum for the Spanish language. Native language English, target language Spanish. I'll need to provide some public-domain materials for you to digest. It will then follow a format described in the sections below. In a nutshell, lessons will be in a sort of interactive "article" format, as alluded to with the "jupyter notebook" idea. They must be long enough that the user gains a solid understanding of the principle being taught, while also being digestable. They should take around 10-15min to go through. You will need to determine what the explanations will be as well as the interactive practices. Nothing will have been put into the app yet, this is simply to structure the lessons and content and verify that what's being taught is factual and based in the materials.  
3. Implement the curriculum in the app. The explanations and sections should all appear. Don't focus on the activities and practices yet--these will be built in the next section. We just want to see that the text and layout is appearing as intended and that the navigation and UX is smooth.
4. Implement the practices and interactive bits. These will need to be tested thoroughly and should be built with TDD (test driven development). 
5. Implement the universal word-saving feature as well as the spaced review vocabulary practice. 
6. There may be more added lol...

##### Considerations:

**Audio transcription:** Once we know what the words in the curriculum are and have some supported target languages, we can batch generate audio with whatever TTS we want. Some that Gemini recommended were Kokoro-82M, Piper, Edge-TTS, but there may be some better options (look at the newest stuff coming out). These can then be stored on Cloudflare R2 or Supabase Storage.

**What's the best way to generate a reliable curriculum for languages?:** US Government FSI/DLI are in the public domain. Some of these are on GitHub too. Tatoeba Project has a bunch of sentence pairs. Wiktionary has a lot of frequency lists to determine which are the most frequently used words and such. CEFR Grammar Inventories (CEFR) has a lot of grammar resources. Apparently there is a resource called freelingo on Hugging Face to check out.

##### Scalability

We don't need to focus on the below things NOW, but we need to adequately plan as we're architecting the project so that these will easily fit in once we decide to introduce them.

###### Curriculum

* Curriculum will be as standardized as such across languages: basics first (pronunciation, alphabet), then learn how to create useful sentences--starting from most basic grammar concepts to more difficult ones. Overall though, the power-pattern will be creation + feedback.
* However, certain languages have their own unique quirks and features, such as tones in Mandarin, different aspects in Slavic languages, or verb transitivity in Q'eqchi'. There are many more examples. These must be handled early on in the curriculum. While the curriculum must follow a pattern, we must be able to account for these differences.
* I would personally like a degree of emphasis on quickly seeing the different "conjugations" (I know not all languages have conjugations) of verbs. Like seeing how to say "I go", "You go", "He/she/it goes", "We go", "You all go", and "They Go". Especially on the most COMMON verbs. 

###### Agentic Features

* Users will have various questions about grammar principles, sentence structure, or anything. They must be able to get immediate answers to these. So, users should have a non-intrusive way to get these answers. It could be something as simple as a "?" button on each text portion of the "jupyter" notebook explaining a principle. They can then ask a question and get an AI response.
* Users need to be able to speak into the app for certain interactive activities. AI will need to be able to evaluate their performance and give them feedback. I'm not sure if AI is capable of evaluating accents, but that would be extremely helpful. The user will also need a transcript of what they said so that they may save any of their difficult words for later practice. They also need to be able to edit the transcript in case the transcription service made any errors.

###### Personalized Practice

* The user should be able to EASILY save words that they have trouble with. What's saved is a native + target language pair. 
* They should be able to practice these in a spaced review. 
