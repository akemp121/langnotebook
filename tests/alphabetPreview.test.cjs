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

// The allowlist prevents the preview from importing global fixture data or audio services.
const { AlphabetPreview } = loadTypeScript('src/components/AlphabetPreview.tsx', {
  'react-native': { View: 'View', Pressable: 'Pressable', StyleSheet: { create: (styles) => styles } },
  '@/components/AppText': { AppText: 'Text' },
  '@/styles/theme': loadTypeScript('src/styles/theme.ts', {}),
});
const imports = { '@/components/AlphabetPreview': { AlphabetPreview } };
const { alphabetPreviewLesson } = loadTypeScript('src/lessons/alphabet.tsx', imports);
const original = alphabetPreviewLesson.sections[0].blocks[1].children;
const { syntheticAlphabetPreview } = loadTypeScript('tests/fixtures/alphabet.tsx', imports);

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
  ['original alphabet example', original],
  ['synthetic alphabet example', syntheticAlphabetPreview],
]) {
  test(`${name} renders supplied letters, sound hints, and variable example counts in order`, () => {
    assert.equal(fixture.type, AlphabetPreview);
    // Inspect keys at the component boundary; keys are not forwarded to native children.
    const cards = AlphabetPreview(fixture.props).props.children;
    assert.equal(cards.length, fixture.props.letters.length);
    assert.deepEqual(cards.map((card) => card.key), fixture.props.letters.map((letter) => letter.id));
    cards.forEach((card, index) => {
      const letter = fixture.props.letters[index];
      const nodes = descendants(render(card));
      assert.deepEqual(nodes.filter((node) => node.type === 'Text').map((node) => node.props.children), [
        '🔊', letter.letter, letter.pronunciationHint,
        ...letter.examples.map((example) => `🔊  ${example.label}`),
      ]);
      const examples = card.type(card.props).props.children[1].props.children;
      assert.deepEqual(examples.map((example) => example.key), letter.examples.map((example) => example.id));
    });
  });

  test(`${name} keeps every audio control disabled and nonfunctional`, () => {
    const nodes = descendants(render(fixture));
    const buttons = nodes.filter((node) => node.type === 'Pressable');
    assert.deepEqual(buttons.map((button) => button.props.accessibilityLabel),
      fixture.props.letters.flatMap((letter) => [
        `Preview pronunciation audio for the letter ${letter.letter}`,
        ...letter.examples.map((example) => `Preview audio for ${example.label}`),
      ]));
    for (const button of buttons) {
      assert.equal(button.props.disabled, true);
      assert.equal(button.props.accessibilityRole, 'button');
      assert.deepEqual(button.props.accessibilityState, { disabled: true });
      assert.equal(button.props.accessibilityHint, 'Static preview only; audio playback is not implemented.');
    }
    for (const node of nodes) {
      assert.equal(node.props.onPress, undefined);
      assert.equal(node.props.onPressIn, undefined);
      assert.equal(node.props.onLongPress, undefined);
    }
  });
}

test('the alphabet lesson supplies the unchanged original fixture', () => {
  assert.deepEqual(original.props.letters, [
    {
      id: 'a-open-vowel',
      letter: 'a',
      pronunciationHint: 'like “o” in “spot”',
      examples: [
        { id: 'espalda', label: 'espalda' },
        { id: 'apoyar', label: 'apoyar' },
        { id: 'jalar', label: 'jalar' },
      ],
    },
    {
      id: 'b-plain-consonant',
      letter: 'b',
      pronunciationHint: 'same as in English',
      examples: [
        { id: 'borrar', label: 'borrar' },
        { id: 'probar', label: 'probar' },
        { id: 'basado', label: 'basado' },
      ],
    },
  ]);
});

test('letter keys follow supplied IDs when the dataset is reordered', () => {
  const letters = [...syntheticAlphabetPreview.props.letters].reverse();
  const cards = AlphabetPreview({ letters }).props.children;
  assert.deepEqual(cards.map((card) => card.key), letters.map((letter) => letter.id));
  cards.forEach((card, index) => {
    assert.ok(descendants(render(card)).some((node) => node.props.children === letters[index].letter));
  });
});

test('an empty dataset renders no letter cards or audio controls', () => {
  const tree = render(AlphabetPreview({ letters: [] }));
  assert.deepEqual(tree.props.children, []);
  assert.equal(descendants(tree).filter((node) => node.type === 'Pressable').length, 0);
});
