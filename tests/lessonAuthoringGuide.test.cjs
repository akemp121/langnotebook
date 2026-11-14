const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

test('the complete authoring-guide lesson typechecks against the actual lesson and preview APIs', () => {
  const root = path.join(__dirname, '..');
  const guide = readFileSync(path.join(root, 'docs/lesson-authoring.md'), 'utf8');
  const examples = [...guide.matchAll(/```tsx\n([\s\S]*?)```/g)];
  assert.equal(examples.length, 1, 'Keep one complete, copyable TSX lesson example');

  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  assert.deepEqual(parsed.errors, []);

  // Virtual file: validate the documented example without writing lesson content
  // to src/, registering it in the app, or loading native modules at runtime.
  const filename = path.join(root, 'src/lessons/__authoring-guide-example.tsx');
  const options = { ...parsed.options, noEmit: true };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => (
    file === filename
      ? ts.createSourceFile(file, examples[0][1], languageVersion, true, ts.ScriptKind.TSX)
      : getSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile)
  );
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
});
