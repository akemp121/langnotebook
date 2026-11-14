const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Load the real route, catalog, lesson, renderer, and previews together. Only native
// primitives and navigation hooks are stubbed: these are wiring, not device tests.
const params = { curriculumId: 'synthetic-tone-lab', lessonId: 'pitch-paths' };
const returnToList = () => {};
const cache = new Map();
const root = path.join(__dirname, '..');
function load(file) {
  const filename = ['', '.ts', '.tsx'].map((ext) => path.resolve(root, file + ext)).find(existsSync);
  assert.ok(filename, `Missing local module: ${file}`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const imports = (id) => {
    if (id === 'react-native') return {
      View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
      StyleSheet: { create: (styles) => styles },
      useWindowDimensions: () => ({ width: 360 }),
    };
    if (id === 'react-native-safe-area-context') return {
      useSafeAreaInsets: () => ({ top: 24, bottom: 16 }),
    };
    if (id === 'expo-router') return { useLocalSearchParams: () => params };
    if (id === '@/hooks/useLessonBackNavigation') return {
      useLessonBackNavigation: () => returnToList,
    };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id));
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    throw new Error(`Unexpected dependency: ${id}`);
  };
  runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename })(
    imports, module, module.exports,
  );
  return module.exports;
}

function expand(node) {
  if (Array.isArray(node)) return node.flatMap(expand);
  if (node == null || typeof node === 'boolean') return [];
  if (typeof node !== 'object') return [node];
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return [{ ...node, children: expand(node.props.children) }];
}
function flatten(nodes) {
  return nodes.flatMap((node) => typeof node === 'object' ? [node, ...flatten(node.children)] : [node]);
}

const { syntheticToneLesson, syntheticToneRegistration } = load('src/fixtures/toneCurriculum');
const { curriculumCatalog, lessonListCatalog } = load('src/data/curriculumCatalog');

test('the synthetic second curriculum resolves by stable IDs but never adds a main-list card', () => {
  assert.deepEqual(curriculumCatalog.curricula.map((entry) => entry.id), [
    'notebook-preview', 'synthetic-tone-lab',
  ]);
  assert.equal(curriculumCatalog.getCurriculum(params.curriculumId), syntheticToneRegistration.curriculum);
  assert.equal(curriculumCatalog.getLesson(params.curriculumId, params.lessonId), syntheticToneLesson);
  assert.deepEqual(curriculumCatalog.getLessons(params.curriculumId), [syntheticToneLesson]);
  assert.equal(lessonListCatalog.getCurriculum(params.curriculumId), undefined);
  assert.equal(curriculumCatalog.getLesson('notebook-preview', params.lessonId), undefined);
  assert.equal(curriculumCatalog.getLesson(params.curriculumId, 'unknown'), undefined);

  const { lessonPreviews } = load('src/data/lessonPreviews');
  assert.deepEqual(lessonPreviews.map((entry) => entry.href.params), [
    { curriculumId: 'notebook-preview', lessonId: 'alphabet' },
    { curriculumId: 'notebook-preview', lessonId: 'grammar' },
  ]);
});

test('the existing parameterized route and shared screen open the real fixture without a new renderer', () => {
  const route = load('src/app/lessons/[curriculumId]/[lessonId]');
  const { LessonScreen } = load('src/screens/LessonScreen');
  const { LessonLayout } = load('src/components/LessonLayout');
  const screen = route.default();
  assert.equal(screen.type, LessonScreen);
  assert.deepEqual(screen.props, params);
  const layout = screen.type(screen.props);
  assert.equal(layout.type, LessonLayout);
  assert.equal(layout.props.sections, syntheticToneLesson.sections);
  assert.equal(layout.props.onBack, returnToList);

  const nodes = flatten(expand(layout));
  const text = nodes.filter((node) => typeof node === 'string').join('\n');
  assert.match(text, /Development fixture · not a real lesson/);
  assert.match(text, /no teaching-quality claim/);
  assert.match(text, /no audio playback, microphone input, tone detection/);
  const before = text.indexOf('For this synthetic fixture only');
  const graphic = text.indexOf('Synthetic pitch paths · static graphic');
  const after = text.indexOf('The notebook continues after the graphic');
  assert.ok(before >= 0 && before < graphic && graphic < after);

  const buttons = nodes.filter((node) => node.type === 'Pressable');
  const previewButtons = buttons.filter((node) => node.props.onPress !== returnToList);
  // Two symbol audio buttons, two example audio buttons, two arrows, three choices.
  assert.equal(previewButtons.length, 9);
  for (const button of previewButtons) {
    assert.equal(button.props.disabled, true);
    assert.equal(button.props.accessibilityState.disabled, true);
    assert.equal(button.props.onPress, undefined);
  }
});

test('the fixture supplies new props to existing previews and opts only the graphic out of its card', () => {
  const { AlphabetPreview } = load('src/components/AlphabetPreview');
  const { ClassificationPracticePreview } = load('src/components/ClassificationPracticePreview');
  const { StaticToneGraphic } = load('src/fixtures/StaticToneGraphic');
  const [before, graphic, after] = syntheticToneLesson.sections[0].blocks;
  assert.deepEqual([before.kind, graphic.kind, after.kind], ['text', 'activity', 'text']);
  assert.equal(graphic.withCard, false);
  assert.equal(graphic.children.type, StaticToneGraphic);
  const [alphabet, classification] = syntheticToneLesson.sections[1].blocks;
  assert.equal(alphabet.withCard, undefined);
  assert.equal(alphabet.children.type, AlphabetPreview);
  assert.deepEqual(alphabet.children.props.letters.map((letter) => letter.letter), ['a', 'e']);
  assert.equal(classification.withCard, undefined);
  assert.equal(classification.children.type, ClassificationPracticePreview);
  assert.deepEqual(classification.children.props.choices.map((choice) => choice.id), ['level', 'rising', 'falling']);
});

test('the small custom graphic is accessible, static, and uses only existing view/text primitives', () => {
  const { StaticToneGraphic } = load('src/fixtures/StaticToneGraphic');
  const figure = StaticToneGraphic();
  assert.equal(figure.props.style.maxWidth, 320);
  assert.equal(figure.props.style.width, '100%');
  const image = figure.props.children[1];
  assert.equal(image.props.accessible, true);
  assert.equal(image.props.accessibilityRole, 'image');
  assert.match(image.props.accessibilityLabel, /not measured audio: A stays level, B rises, C falls/);
  assert.deepEqual(image.props.children.map((entry) => entry.props.children[0].props.children.map(
    (dot) => dot.props.style[1].marginBottom,
  )), [[20, 20, 20, 20, 20], [0, 10, 20, 30, 40], [40, 30, 20, 10, 0]]);
  const nodes = flatten(expand(figure)).filter((node) => typeof node === 'object');
  for (const node of nodes) {
    assert.ok(['View', 'Text'].includes(node.type));
    assert.equal(node.props.onPress, undefined);
    assert.equal(node.props.onLayout, undefined);
  }
});
