// Monaco Editor worker setup for Vite with lazy loading

// Dynamic worker imports for better performance
const getEditorWorker = () =>
  import("monaco-editor/esm/vs/editor/editor.worker?worker");
const getJsonWorker = () =>
  import("monaco-editor/esm/vs/language/json/json.worker?worker");
const getCssWorker = () =>
  import("monaco-editor/esm/vs/language/css/css.worker?worker");
const getHtmlWorker = () =>
  import("monaco-editor/esm/vs/language/html/html.worker?worker");
const getTsWorker = () =>
  import("monaco-editor/esm/vs/language/typescript/ts.worker?worker");

// Worker cache for reuse
const workerCache = new Map<string, any>();

// Setup Monaco Environment with lazy worker loading
if (typeof window !== "undefined") {
  (window as any).MonacoEnvironment = {
    async getWorker(_: any, label: string) {
      // Check cache first
      if (workerCache.has(label)) {
        const WorkerClass = workerCache.get(label);
        return new WorkerClass();
      }

      let WorkerModule;

      switch (label) {
        case "json":
          WorkerModule = await getJsonWorker();
          break;
        case "css":
        case "scss":
        case "less":
          WorkerModule = await getCssWorker();
          break;
        case "html":
        case "handlebars":
        case "razor":
          WorkerModule = await getHtmlWorker();
          break;
        case "typescript":
        case "javascript":
          WorkerModule = await getTsWorker();
          break;
        default:
          WorkerModule = await getEditorWorker();
          break;
      }

      // Cache the worker class
      const WorkerClass = WorkerModule.default;
      workerCache.set(label, WorkerClass);

      return new WorkerClass();
    },
  };
}

export {};
