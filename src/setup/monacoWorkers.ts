// Wire up Monaco Editor web workers for Vite so language services don't block the UI
// Reference: https://github.com/microsoft/monaco-editor#using-with-vite

// Import worker classes for each language/feature we care about
// The `?worker` query tells Vite to bundle these as Web Workers
// eslint-disable-next-line import/default
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// eslint-disable-next-line import/default
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// eslint-disable-next-line import/default
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// eslint-disable-next-line import/default
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// eslint-disable-next-line import/default
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Expose MonacoEnvironment so Monaco knows how to spawn workers per language label
// We attach to `self` to cover both window and worker global scopes.
// Typescript may not know about MonacoEnvironment on the global, so we cast to any.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  }
};

export {};
