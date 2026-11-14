const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInThisContext } = require('node:vm');
const { Fragment, createElement } = require('react');
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
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    throw new Error(`Unexpected dependency in ${file}: ${id}`);
  };
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename })(
    load, module, module.exports,
  );
  return module.exports;
}

const theme = loadTypeScript('src/styles/theme.ts', {});

function layoutHarness(width) {
  const imports = {
    'react-native': {
      View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable',
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => ({ width }),
    },
    './AppText': { AppText: 'Text' },
    '@/styles/theme': theme,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) },
  };
  const { ActivityCard } = loadTypeScript('src/components/ActivityCard.tsx', imports);
  const { LessonLayout } = loadTypeScript('src/components/LessonLayout.tsx', {
    ...imports, './ActivityCard': { ActivityCard },
  });
  function blocksInLayout(blocks) {
    const tree = LessonLayout({
      title: 'Presentation test', onBack: () => {},
      sections: [{ id: 'section', title: 'Section', blocks }],
    });
    // Scroll content -> header/sections -> first section -> heading/blocks.
    const sections = tree.props.children.props.children.props.children[1];
    return sections.props.children[0].props.children[1].props.children;
  }
  return { ActivityCard, blocksInLayout };
}

const previewImports = Object.fromEntries([
  'AlphabetPreview', 'ClassificationPracticePreview', 'ConversationPracticePreview',
].map((name) => [`@/components/${name}`, { [name]: () => null }]));
const { alphabetPreviewLesson } = loadTypeScript('src/lessons/alphabet.tsx', previewImports);
const { grammarPreviewLesson } = loadTypeScript('src/lessons/grammar.tsx', previewImports);

for (const width of [360, 390, 768]) {
  const { ActivityCard, blocksInLayout } = layoutHarness(width);

  for (const lesson of [alphabetPreviewLesson, grammarPreviewLesson]) {
    test(`${lesson.id} at width ${width} retains every default card, heading, and child`, () => {
      for (const section of lesson.sections) {
        const rendered = blocksInLayout(section.blocks);
        assert.equal(rendered.length, section.blocks.length);
        section.blocks.forEach((block, index) => {
          if (block.kind !== 'activity') return;
          const element = rendered[index];
          assert.equal(block.withCard, undefined);
          assert.equal(element.type, ActivityCard);
          assert.equal(element.key, block.id);
          assert.deepEqual(element.props, {
            eyebrow: block.eyebrow, title: block.title, children: block.children,
          });
          const card = ActivityCard(element.props);
          const style = Object.assign({}, ...card.props.style);
          assert.equal(style.padding, width < 380 ? theme.spacing.md : theme.spacing.lg);
          assert.equal(style.backgroundColor, theme.palette.card);
          assert.equal(style.borderWidth, 1);
          assert.equal(card.props.children[0].props.children, block.eyebrow);
          assert.equal(card.props.children[1].props.children, block.title);
          assert.equal(card.props.children[2].type, 'View');
          assert.equal(card.props.children[2].props.children, block.children);
        });
      }
    });
  }

  test(`explicit withCard true uses the same wrapper at width ${width}`, () => {
    const block = { id: 'explicit-card', kind: 'activity', children: 'Content' };
    const [defaultCard, explicitCard] = blocksInLayout([block, { ...block, id: 'other', withCard: true }]);
    assert.equal(explicitCard.type, ActivityCard);
    assert.equal(defaultCard.type, explicitCard.type);
    assert.deepEqual(defaultCard.props, explicitCard.props);
  });

  test(`a self-framed component receives no card padding or headings at width ${width}`, () => {
    function CustomActivity({ label }) {
      return createElement('View', { style: { padding: 0 } }, label);
    }
    const child = createElement(CustomActivity, { label: 'Own framing' });
    const block = {
      id: 'self-framed', kind: 'activity', withCard: false, children: child,
      title: 'Card-only title', eyebrow: 'Card-only eyebrow',
    };
    const [element] = blocksInLayout([block]);
    assert.equal(element.type, Fragment);
    assert.equal(element.key, block.id);
    // No native wrapper, styles, or card-only headings are injected.
    assert.deepEqual(element.props, { children: child });
    assert.equal(element.props.children, child);
    assert.deepEqual(child.type(child.props).props, { style: { padding: 0 }, children: 'Own framing' });
  });
}

test('unframed activities preserve arbitrary React children without inspecting their shape', () => {
  const { blocksInLayout } = layoutHarness(390);
  for (const children of [
    null, false, 'Text node', 42,
    [createElement('View', { key: 'one' }), null, createElement('View', { key: 'two' })],
    createElement(Fragment, null, createElement('View'), createElement('View')),
  ]) {
    const [element] = blocksInLayout([{ id: 'arbitrary', kind: 'activity', withCard: false, children }]);
    assert.equal(element.type, Fragment);
    assert.equal(element.props.children, children);
  }
});

test('mixed text, default cards, and unframed activities keep block order and stable keys', () => {
  const { ActivityCard, blocksInLayout } = layoutHarness(390);
  const blocks = [
    { id: 'before', kind: 'text', paragraphs: ['Before the activities.'] },
    { id: 'default', kind: 'activity', children: createElement('View') },
    { id: 'custom', kind: 'activity', withCard: false, children: createElement('View') },
    { id: 'after', kind: 'text', paragraphs: ['After the activities.'] },
  ];
  for (const ordered of [blocks, [...blocks].reverse()]) {
    const rendered = blocksInLayout(ordered);
    assert.deepEqual(rendered.map((element) => element.key), ordered.map((block) => block.id));
    ordered.forEach((block, index) => {
      const element = rendered[index];
      if (block.kind === 'text') {
        assert.equal(element.type, 'View');
        assert.deepEqual(element.props.children.map((paragraph) => paragraph.props.children), block.paragraphs);
      } else {
        assert.equal(element.type, block.withCard === false ? Fragment : ActivityCard);
        assert.equal(element.props.children, block.children);
      }
    });
  }
});
