const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Component-wiring checks only: native primitives are stubbed, not visually rendered.
function loadTypeScript(file, imports) {
  const filename = path.join(__dirname, '..', file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const module = { exports: {} };
  const load = (id) => {
    if (Object.hasOwn(imports, id)) return imports[id];
    if (id === 'react/jsx-runtime') return require(id);
    throw new Error(`Unexpected dependency in ${file}: ${id}`);
  };
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename })(
    load, module, module.exports,
  );
  return module.exports;
}

// The strict import allowlist also guards against fixture or service imports in the preview.
const { ConversationPracticePreview } = loadTypeScript('src/components/ConversationPracticePreview.tsx', {
  'react-native': { View: 'View', Pressable: 'Pressable', StyleSheet: { create: (styles) => styles } },
  '@/components/AppText': { AppText: 'Text' },
  '@/styles/theme': loadTypeScript('src/styles/theme.ts', {}),
});
const imports = {
  '@/components/ClassificationPracticePreview': { ClassificationPracticePreview: () => null },
  '@/components/ConversationPracticePreview': { ConversationPracticePreview },
};
const { grammarPreviewLesson } = loadTypeScript('src/lessons/grammar.tsx', imports);
const original = grammarPreviewLesson.sections[1].blocks[1].children;
const { syntheticConversationPreview } = loadTypeScript('tests/fixtures/conversation.tsx', imports);

function render(element) {
  if (element == null || typeof element !== 'object') return element;
  if (Array.isArray(element)) return element.map(render);
  if (typeof element.type === 'function') return render(element.type(element.props));
  return { type: element.type, key: element.key, props: { ...element.props, children: render(element.props.children) } };
}

function descendants(node) {
  if (node == null || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  return [node, ...descendants(node.props.children)];
}

for (const [name, fixture] of [
  ['original Spanish/English example', original],
  ['synthetic French/German example', syntheticConversationPreview],
]) {
  test(`${name} renders supplied instructions, language context, and dialogue`, () => {
    assert.equal(fixture.type, ConversationPracticePreview);
    const nodes = descendants(render(fixture));
    const text = nodes.filter((node) => node.type === 'Text');
    const { instruction, questionNumber, totalQuestions, languageContext, turns } = fixture.props;
    const expectedText = [instruction, `${questionNumber}/${totalQuestions}`,
      ...turns.flatMap((turn) => [turn.speaker, turn.targetText, turn.translation])];
    for (const value of expectedText) {
      assert.ok(text.some((node) => node.props.children === value), `Missing text: ${value}`);
    }
    assert.ok(text.some((node) => node.props.accessibilityLabel === `Question ${questionNumber} of ${totalQuestions}`));
    for (const turn of turns) {
      assert.ok(text.some((node) => node.props.children === turn.targetText
        && node.props.accessibilityLabel === `${languageContext.targetLanguage}: ${turn.targetText}`));
      assert.ok(text.some((node) => node.props.children === turn.translation
        && node.props.accessibilityLabel === `${languageContext.translationLanguage}: ${turn.translation}`));
    }
    assert.deepEqual(nodes.filter((node) => node.key != null).map((node) => node.key), turns.map((turn) => turn.id));
  });

  test(`${name} keeps all controls disabled and the microphone noninteractive`, () => {
    const nodes = descendants(render(fixture));
    const buttons = nodes.filter((node) => node.type === 'Pressable');
    assert.equal(buttons.length, 4);
    assert.deepEqual(buttons.map((button) => button.props.accessibilityLabel), [
      'Previous conversation prompt', 'Next conversation prompt',
      'Ask question preview button', 'Submit answer preview button',
    ]);
    for (const button of buttons) {
      assert.equal(button.props.disabled, true);
      assert.deepEqual(button.props.accessibilityState, { disabled: true });
    }
    for (const node of nodes) {
      assert.equal(node.props.onPress, undefined);
      assert.equal(node.props.onPressIn, undefined);
      assert.equal(node.props.onLongPress, undefined);
    }
    const microphone = nodes.find((node) => node.props.accessibilityRole === 'image');
    assert.equal(microphone.type, 'View');
    assert.equal(microphone.props.accessibilityLabel, 'Microphone preview icon; recording is not implemented.');
    assert.ok(nodes.some((node) => node.props.children ===
      'Static UI shell: recording, transcription, AI responses, and submission are not implemented.'));
  });
}

test('turn IDs stay attached to content when repeated speakers are reordered', () => {
  const { turns } = syntheticConversationPreview.props;
  assert.equal(turns[0].speaker, turns[2].speaker);
  const reordered = [turns[2], turns[0], turns[1]];
  const nodes = descendants(render(ConversationPracticePreview({
    ...syntheticConversationPreview.props,
    turns: reordered,
  })));
  const keyedTurns = nodes.filter((node) => node.key != null);
  assert.deepEqual(keyedTurns.map((node) => node.key), reordered.map((turn) => turn.id));
  assert.equal(new Set(keyedTurns.map((node) => node.key)).size, 3);
  keyedTurns.forEach((node, index) => {
    assert.ok(descendants(node).some((child) => child.props.children === reordered[index].targetText));
  });
});

test('Spanish fixture lives in the grammar lesson with unchanged visible content', () => {
  assert.deepEqual(original.props, {
    questionNumber: 1,
    totalQuestions: 8,
    instruction: 'Listen to the situation, then practice answering out loud in the target language.',
    languageContext: { targetLanguage: 'Spanish', translationLanguage: 'English' },
    turns: [
      {
        id: 'tutor-destination-question',
        speaker: 'Tutor',
        targetText: '¿Adónde vas?',
        translation: 'Where are you going?',
      },
      {
        id: 'learner-market-answer',
        speaker: 'Learner',
        targetText: 'Voy al mercado.',
        translation: 'I am going to the market.',
      },
    ],
  });
});
