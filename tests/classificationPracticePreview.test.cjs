const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Follow the existing component-wiring tests: no native runtime required.
function loadTypeScript(file, imports) {
  const filename = path.join(__dirname, '..', file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const module = { exports: {} };
  const load = (id) => Object.hasOwn(imports, id) ? imports[id] : require(id);
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename })(
    load, module, module.exports,
  );
  return module.exports;
}

const { ClassificationPracticePreview } = loadTypeScript('src/components/ClassificationPracticePreview.tsx', {
  'react-native': { View: 'View', Pressable: 'Pressable', StyleSheet: { create: (styles) => styles } },
  '@/components/AppText': { AppText: 'Text' },
  '@/styles/theme': loadTypeScript('src/styles/theme.ts', {}),
});
const imports = {
  '@/components/ClassificationPracticePreview': { ClassificationPracticePreview },
  '@/components/ConversationPracticePreview': { ConversationPracticePreview: () => null },
};
const { grammarPreviewLesson } = loadTypeScript('src/lessons/grammar.tsx', imports);
const original = grammarPreviewLesson.sections[0].blocks[1].children;
const { threeCategoryPreview } = loadTypeScript('tests/fixtures/classification.tsx', imports);

function render(element) {
  if (element == null || typeof element !== 'object') return element;
  if (Array.isArray(element)) return element.map(render);
  if (typeof element.type === 'function') return render(element.type(element.props));
  return { type: element.type, props: { ...element.props, children: render(element.props.children) } };
}

function descendants(node) {
  if (node == null || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  return [node, ...descendants(node.props.children)];
}

for (const [name, fixture, count] of [
  ['original transitivity example', original, 2],
  ['synthetic three-category example', threeCategoryPreview, 3],
]) {
  test(`${name} uses configurable copy and disabled controls`, () => {
    assert.equal(fixture.type, ClassificationPracticePreview);
    const nodes = descendants(render(fixture));
    const text = nodes.filter((node) => node.type === 'Text');
    const { prompt, instruction, questionNumber, totalQuestions, choices } = fixture.props;
    for (const value of [prompt, instruction, `${questionNumber}/${totalQuestions}`, ...choices.map((c) => c.label)]) {
      assert.ok(text.some((node) => node.props.children === value), `Missing text: ${value}`);
    }
    assert.ok(text.some((node) => node.props.accessibilityLabel === `Question ${questionNumber} of ${totalQuestions}`));
    const buttons = nodes.filter((node) => node.type === 'Pressable');
    assert.equal(buttons.length, count + 2);
    for (const button of buttons) {
      assert.equal(button.props.disabled, true);
      assert.deepEqual(button.props.accessibilityState, { disabled: true });
      assert.equal(button.props.onPress, undefined);
    }
    assert.deepEqual(buttons.slice(2).map((button) => button.props.accessibilityLabel),
      choices.map((choice) => `Preview answer: ${choice.label}`));
  });
}

test('original fixture remains in the grammar lesson with unchanged content', () => {
  assert.deepEqual(original.props, {
    questionNumber: 1,
    totalQuestions: 10,
    prompt: 'The child reads a book.',
    instruction: 'Classify whether the highlighted action points toward an object.',
    choices: [
      { id: 'transitive', label: 'Transitive' },
      { id: 'intransitive', label: 'Intransitive' },
    ],
  });
});
