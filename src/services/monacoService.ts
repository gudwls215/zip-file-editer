import * as monaco from 'monaco-editor';
import { getLanguageFromFilename } from '../utils/fileUtils';

export interface IMonacoEditorService {
  initialize(): Promise<void>;
  createEditor(container: HTMLElement, options?: monaco.editor.IStandaloneEditorConstructionOptions): monaco.editor.IStandaloneCodeEditor;
  createModel(uri: string, content: string, language?: string): monaco.editor.ITextModel;
  getOrCreateModel(uri: string, content: string, language?: string): monaco.editor.ITextModel;
  disposeModel(uri: string): void;
  dispose(): void;
  isInitialized(): boolean;
}

export class MonacoService implements IMonacoEditorService {
  private static instance: MonacoService;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private models: Map<string, monaco.editor.ITextModel> = new Map();
  private editors: Set<monaco.editor.IStandaloneCodeEditor> = new Set();
  private initialized: boolean = false;

  static getInstance(): MonacoService {
    if (!MonacoService.instance) {
      MonacoService.instance = new MonacoService();
    }
    return MonacoService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Monaco is already loaded via vite-plugin-monaco-editor
      this.configureMonaco();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Monaco: ${error}`);
    }
  }

  async initializeMonaco(): Promise<void> {
    return this.initialize();
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

  createEditor(
    container: HTMLElement, 
    options: monaco.editor.IStandaloneEditorConstructionOptions = {}
  ): monaco.editor.IStandaloneCodeEditor {
    if (!this.initialized) {
      throw new Error('MonacoService must be initialized before creating editors');
    }

    const editor = monaco.editor.create(container, {
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      lineNumbers: 'on',
      ...options
    });

    this.editors.add(editor);
    
    // Auto-cleanup when editor is disposed
    editor.onDidDispose(() => {
      this.editors.delete(editor);
    });

    return editor;
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

  getOrCreateModel(uri: string, content: string, language?: string): monaco.editor.ITextModel {
    const existing = this.models.get(uri);
    if (existing) {
      if (existing.getValue() !== content) {
        existing.setValue(content);
      }
      return existing;
    }
    
    const detectedLanguage = language || this.detectLanguage(uri);
    const monacoUri = monaco.Uri.parse(uri);
    const model = monaco.editor.createModel(content, detectedLanguage, monacoUri);
    this.models.set(uri, model);
    
    return model;
  }

  disposeModel(uri: string): void {
    const model = this.models.get(uri);
    if (model) {
      model.dispose();
      this.models.delete(uri);
    }
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

  dispose(): void {
    // Dispose all models
    this.models.forEach(model => model.dispose());
    this.models.clear();
    
    // Dispose all editors
    this.editors.forEach(editor => editor.dispose());
    this.editors.clear();
    
    this.editor?.dispose();
    this.editor = null;
    this.initialized = false;
  }

  private detectLanguage(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    
    return languageMap[extension] || 'plaintext';
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Legacy methods for backward compatibility
  initEditor(container: HTMLElement, options?: monaco.editor.IStandaloneEditorConstructionOptions): monaco.editor.IStandaloneCodeEditor {
    this.editor = this.createEditor(container, options);
    return this.editor;
  }

  setTheme(theme: string): void {
    monaco.editor.setTheme(theme);
  }

  disposeEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    if (editor && typeof editor.dispose === 'function') {
      editor.dispose();
    }
  }
}
