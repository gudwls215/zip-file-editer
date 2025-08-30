// Monaco Editor worker setup for Vite
// This sets up web workers for different language services

// Only set up workers in browser environment
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorker: function (_moduleId: string, label: string) {
      // Import workers dynamically
      switch (label) {
        case 'json':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
            { type: 'module' }
          );
        case 'css':
        case 'scss':
        case 'less':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url),
            { type: 'module' }
          );
        case 'html':
        case 'handlebars':
        case 'razor':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url),
            { type: 'module' }
          );
        case 'typescript':
        case 'javascript':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
            { type: 'module' }
          );
        default:
          return new Worker(
            new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
            { type: 'module' }
          );
      }
    }
  };
}

export {};
