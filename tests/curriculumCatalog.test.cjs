const assert = require('node:assert/strict');
const { test } = require('node:test');

const { readFileSync } = require('node:fs');
const path = require('node:path');
const { runInThisContext } = require('node:vm');
const ts = require('typescript');

// Use the existing TS compiler, not an RN runtime or an additional test framework.
function loadTypeScript(file, imports = {}) {
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

const builder = loadTypeScript('src/data/createCurriculumCatalog.ts');
const { createCurriculumCatalog } = builder;

test('the bundled catalog resolves both actual preview definitions in order', () => {
  // Activity components are not rendered: stub only the native UI leaves.
  const alphabetModule = loadTypeScript('src/lessons/alphabet.tsx', {
    '@/components/AlphabetPreview': { AlphabetPreview: () => null },
  });
  const grammarModule = loadTypeScript('src/lessons/grammar.tsx', {
    '@/components/ClassificationPracticePreview': { ClassificationPracticePreview: () => null },
    '@/components/ConversationPracticePreview': { ConversationPracticePreview: () => null },
  });
  const { curriculumCatalog: catalog } = loadTypeScript('src/data/curriculumCatalog.ts', {
    '../lessons/alphabet': alphabetModule,
    '../lessons/grammar': grammarModule,
    './createCurriculumCatalog': builder,
  });
  assert.equal(catalog.getLesson('notebook-preview', 'alphabet'), alphabetModule.alphabetPreviewLesson);
  assert.equal(catalog.getLesson('notebook-preview', 'grammar'), grammarModule.grammarPreviewLesson);
  assert.deepEqual(catalog.getLessons('notebook-preview').map((lesson) => lesson.id), ['alphabet', 'grammar']);
  assert.equal(catalog.getLesson('notebook-preview', 'unknown'), undefined);
  assert.equal(catalog.getLesson('unknown', 'alphabet'), undefined);
});

const alphabet = { id: 'alphabet', title: 'Alphabet', sections: [] };
const grammar = { id: 'grammar', title: 'Grammar', sections: [] };
const curriculum = {
  id: 'preview',
  title: 'Preview',
  instructionLanguage: { tag: 'en' },
  targetLanguage: { tag: 'es' },
  lessonIds: ['alphabet', 'grammar'],
};
const register = (metadata = curriculum, lessons = [alphabet, grammar]) => ({
  curriculum: metadata,
  lessons,
});

test('lookup uses curriculum/lesson identity and explicit lessonIds order', () => {
  const catalog = createCurriculumCatalog([register(curriculum, [grammar, alphabet])]);
  assert.equal(catalog.getCurriculum('preview'), curriculum);
  assert.equal(catalog.getLesson('preview', 'alphabet'), alphabet);
  assert.equal(catalog.getLesson('preview', 'grammar'), grammar);
  assert.deepEqual(catalog.getLessons('preview'), [alphabet, grammar]);
  assert.deepEqual(catalog.curricula, [curriculum]);
});

test('unknown IDs return undefined, including object-prototype property names', () => {
  const catalog = createCurriculumCatalog([register()]);
  for (const id of ['unknown', '', '__proto__', 'constructor']) {
    assert.equal(catalog.getCurriculum(id), undefined);
    assert.equal(catalog.getLesson(id, 'alphabet'), undefined);
    assert.equal(catalog.getLesson('preview', id), undefined);
    assert.equal(catalog.getLessons(id), undefined);
  }
});

test('lesson IDs may repeat across curricula; curricula retain registration order', () => {
  const other = { ...curriculum, id: 'other', lessonIds: ['alphabet'] };
  const otherLesson = { ...alphabet, title: 'Other alphabet' };
  const catalog = createCurriculumCatalog([register(), register(other, [otherLesson])]);
  assert.equal(catalog.getLesson('preview', 'alphabet'), alphabet);
  assert.equal(catalog.getLesson('other', 'alphabet'), otherLesson);
  assert.deepEqual(catalog.curricula, [curriculum, other]);
});

test('duplicate curriculum IDs include the offending identity in the error', () => {
  assert.throws(() => createCurriculumCatalog([register(), register()]),
    /Duplicate curriculum ID "preview"/);
});

test('duplicate lesson registrations are rejected within their curriculum', () => {
  assert.throws(() => createCurriculumCatalog([register(curriculum, [alphabet, alphabet])]),
    /Duplicate lesson ID "alphabet" in curriculum "preview"/);
});

test('duplicate ordering references are rejected', () => {
  assert.throws(() => createCurriculumCatalog([
    register({ ...curriculum, lessonIds: ['alphabet', 'alphabet'] }, [alphabet]),
  ]), /Duplicate lesson reference "alphabet" in curriculum "preview"/);
});

test('missing lesson references identify the curriculum and missing lesson', () => {
  assert.throws(() => createCurriculumCatalog([register(curriculum, [alphabet])]),
    /Curriculum "preview" references missing lesson "grammar"/);
});

test('registered lessons cannot silently disappear from the ordered catalog', () => {
  assert.throws(() => createCurriculumCatalog([
    register({ ...curriculum, lessonIds: ['alphabet'] }),
  ]), /Lesson "grammar" is not listed in curriculum "preview" lessonIds/);
});

test('an empty catalog and an empty curriculum are valid', () => {
  assert.deepEqual(createCurriculumCatalog([]).curricula, []);
  const catalog = createCurriculumCatalog([register({ ...curriculum, lessonIds: [] }, [])]);
  assert.deepEqual(catalog.getLessons('preview'), []);
});
