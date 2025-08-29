import * as monaco from 'monaco-editor';
import { getLanguageFromFilename } from '../utils/fileUtils';

export class MonacoService {
  private static instance: MonacoService;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private models: Map<string, monaco.editor.ITextModel> = new Map();

  static getInstance(): MonacoService {
    if (!MonacoService.instance) {
      MonacoService.instance = new MonacoService();
    }
    return MonacoService.instance;
  }

  async initializeMonaco(): Promise<void> {
    // Monaco is already loaded via vite-plugin-monaco-editor
    this.configureMonaco();
  }

  private configureMonaco(): void {
    // Set theme
    monaco.editor.setTheme('vs-dark');

    // Configure language features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    // Disable validation for JavaScript files
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });
  }

  initEditor(container: HTMLElement, options?: monaco.editor.IStandaloneEditorConstructionOptions): monaco.editor.IStandaloneCodeEditor {
    this.editor = monaco.editor.create(container, {
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      ...options
    });

    return this.editor;
  }

  createModel(path: string, content: string): monaco.editor.ITextModel {
    const existing = this.models.get(path);
    if (existing) {
      existing.setValue(content);
      return existing;
    }

    const language = getLanguageFromFilename(path);
    const model = monaco.editor.createModel(
      content,
      language,
      monaco.Uri.file(path)
    );

    this.models.set(path, model);
    return model;
  }

  setModel(path: string, content: string): void {
    if (!this.editor) return;
    
    const model = this.createModel(path, content);
    this.editor.setModel(model);
  }

  getModel(path: string): monaco.editor.ITextModel | undefined {
    return this.models.get(path);
  }

  getLanguageFromFilename(filename: string): string {
    return getLanguageFromFilename(filename);
  }

  createEditor(container: HTMLElement, value: string, language: string): monaco.editor.IStandaloneCodeEditor {
    return monaco.editor.create(container, {
      value,
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true
    });
  }

  setTheme(theme: string): void {
    monaco.editor.setTheme(theme);
  }

  disposeEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    if (editor && typeof editor.dispose === 'function') {
      editor.dispose();
    }
  }

  dispose(): void {
    this.models.forEach(model => model.dispose());
    this.models.clear();
    this.editor?.dispose();
    this.editor = null;
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  isInitialized(): boolean {
    return true; // Monaco is always available via plugin
  }
}
