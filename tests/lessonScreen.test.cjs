const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Inspect component wiring without introducing a native runtime or test framework.
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

const AppText = () => null;
const DarkButton = () => null;
const LessonLayout = () => null;
const ScreenShell = () => null;

function screenHarness(lesson) {
  const lookups = [];
  let hookCalls = 0;
  let returns = 0;
  const returnToLessonList = () => { returns += 1; };
  const { LessonScreen } = loadTypeScript('src/screens/LessonScreen.tsx', {
    '@/components/AppText': { AppText },
    '@/components/DarkButton': { DarkButton },
    '@/components/LessonLayout': { LessonLayout },
    '@/components/ScreenShell': { ScreenShell },
    '@/data/curriculumCatalog': {
      curriculumCatalog: {
        getLesson: (...ids) => { lookups.push(ids); return lesson; },
      },
    },
    '@/hooks/useLessonBackNavigation': {
      useLessonBackNavigation: () => { hookCalls += 1; return returnToLessonList; },
    },
  });
  return {
    LessonScreen,
    lookups,
    returnToLessonList,
    get hookCalls() { return hookCalls; },
    get returns() { return returns; },
  };
}

for (const lessonId of ['alphabet', 'grammar']) {
  test(`${lessonId} route delegates to the shared screen with catalog IDs`, () => {
    const LessonScreen = () => null;
    const route = loadTypeScript(`src/app/lessons/${lessonId}.tsx`, {
      '@/screens/LessonScreen': { LessonScreen },
    });
    const element = route.default();
    assert.equal(element.type, LessonScreen);
    assert.deepEqual(element.props, { curriculumId: 'notebook-preview', lessonId });
  });

  test(`${lessonId} screen passes the catalog definition and existing back handler to the layout`, () => {
    const lesson = { id: lessonId, title: 'Preview', introduction: ['Intro'], sections: [] };
    const harness = screenHarness(lesson);
    const element = harness.LessonScreen({ curriculumId: 'notebook-preview', lessonId });
    assert.deepEqual(harness.lookups, [['notebook-preview', lessonId]]);
    assert.equal(harness.hookCalls, 1);
    assert.equal(element.type, LessonLayout);
    assert.deepEqual(element.props, {
      ...lesson,
      backAccessibilityLabel: 'Return to lesson previews',
      onBack: harness.returnToLessonList,
    });
    element.props.onBack();
    assert.equal(harness.returns, 1);
  });
}

for (const [curriculumId, lessonId] of [
  ['notebook-preview', 'unknown'], ['unknown', 'alphabet'],
  [undefined, 'alphabet'], ['notebook-preview', undefined], [undefined, undefined],
  ['', 'alphabet'], ['notebook-preview', ''],
]) {
  test(`missing ${curriculumId}/${lessonId} has readable copy and a working return action`, () => {
    const harness = screenHarness(undefined);
    const element = harness.LessonScreen({ curriculumId, lessonId });
    assert.deepEqual(harness.lookups, curriculumId && lessonId ? [[curriculumId, lessonId]] : []);
    assert.equal(harness.hookCalls, 1);
    assert.equal(element.type, ScreenShell);
    const [heading, explanation, button] = element.props.children;
    assert.equal(heading.props.children, 'Lesson not found');
    assert.match(explanation.props.children, /not available/);
    assert.equal(button.type, DarkButton);
    assert.equal(button.props.label, 'Return to lesson previews');
    assert.equal(button.props.onPress, harness.returnToLessonList);
    button.props.onPress();
    assert.equal(harness.returns, 1);
  });
}

for (const params of [
  { curriculumId: 'notebook-preview', lessonId: 'alphabet' },
  { curriculumId: 'notebook-preview', lessonId: 'grammar' },
  { curriculumId: 'another-curriculum', lessonId: 'new-lesson' },
  { curriculumId: 'unknown', lessonId: 'unknown' },
  {},
  { curriculumId: 'notebook-preview' },
  { curriculumId: ['notebook-preview'], lessonId: ['alphabet', 'grammar'] },
  { curriculumId: '', lessonId: '%bad/id' },
]) {
  test(`parameterized route safely forwards IDs: ${JSON.stringify(params)}`, () => {
    const LessonScreen = () => null;
    const route = loadTypeScript('src/app/lessons/[curriculumId]/[lessonId].tsx', {
      'expo-router': { useLocalSearchParams: () => params },
      '@/screens/LessonScreen': { LessonScreen },
    });
    const element = route.default();
    assert.equal(element.type, LessonScreen);
    assert.deepEqual(element.props, {
      curriculumId: typeof params.curriculumId === 'string' ? params.curriculumId : undefined,
      lessonId: typeof params.lessonId === 'string' ? params.lessonId : undefined,
    });
  });
}

test('shared back handler targets the list for direct entry and stacked navigation', () => {
  // Expo Router dismissTo pops to an existing list or replaces a direct-entry screen.
  const targets = [];
  const { returnToLessonList } = loadTypeScript('src/hooks/useLessonBackNavigation.ts', {
    'react-native': {},
    'expo-router': { router: { dismissTo: (href) => targets.push(href) } },
  });
  returnToLessonList();
  assert.deepEqual(targets, ['/']);
});

test('Android hardware back uses the shared return action and removes its listener', () => {
  let listener;
  let removed = false;
  let cleanup;
  const targets = [];
  const { useLessonBackNavigation } = loadTypeScript('src/hooks/useLessonBackNavigation.ts', {
    react: { useCallback: (callback) => callback },
    'react-native': {
      Platform: { OS: 'android' },
      BackHandler: { addEventListener: (event, callback) => {
        assert.equal(event, 'hardwareBackPress');
        listener = callback;
        return { remove: () => { removed = true; } };
      } },
    },
    'expo-router': {
      router: { dismissTo: (href) => targets.push(href) },
      useFocusEffect: (effect) => { cleanup = effect(); },
    },
  });
  useLessonBackNavigation();
  assert.equal(listener(), true);
  assert.deepEqual(targets, ['/']);
  cleanup();
  assert.equal(removed, true);
});
