import { getLanguageFromExtension, getFileExtension } from '../utils/fileUtils';

export class MonacoService {
  private static instance: MonacoService;
  private monaco: any = null;

  static getInstance(): MonacoService {
    if (!MonacoService.instance) {
      MonacoService.instance = new MonacoService();
    }
    return MonacoService.instance;
  }

  async initializeMonaco(): Promise<void> {
    if (this.monaco) return;

    try {
      // Import Monaco Editor
      const monacoModule = await import('monaco-editor');
      this.monaco = monacoModule.default || monacoModule;

      // Configure Monaco environment
      this.configureMonaco();
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      throw new Error('Failed to load Monaco Editor');
    }
  }

  private configureMonaco(): void {
    if (!this.monaco) return;

    // Set theme
    this.monaco.editor.setTheme('vs-dark');

    // Configure language features
    this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: this.monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: this.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: this.monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: this.monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    // Disable validation for JavaScript files
    this.monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });
  }

  getLanguageFromFilename(filename: string): string {
    const extension = getFileExtension(filename);
    return getLanguageFromExtension(extension);
  }

  createEditor(container: HTMLElement, value: string, language: string): any {
    if (!this.monaco) {
      throw new Error('Monaco Editor not initialized');
    }

    return this.monaco.editor.create(container, {
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
    if (!this.monaco) return;
    this.monaco.editor.setTheme(theme);
  }

  disposeEditor(editor: any): void {
    if (editor && typeof editor.dispose === 'function') {
      editor.dispose();
    }
  }

  isInitialized(): boolean {
    return this.monaco !== null;
  }
}
