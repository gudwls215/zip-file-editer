import * as monaco from "monaco-editor";
import { getLanguageFromFilename } from "../utils/fileUtils";

/**
 * IMonacoEditorService - Monaco 에디터 서비스 인터페이스
 *
 * Monaco Editor의 라이프사이클과 모델 관리를 위한 표준 인터페이스
 * 다른 구현체로 교체 가능하도록 추상화
 */
export interface IMonacoEditorService {
  initialize(): Promise<void>;
  createEditor(
    container: HTMLElement,
    options?: monaco.editor.IStandaloneEditorConstructionOptions
  ): monaco.editor.IStandaloneCodeEditor;
  createModel(
    uri: string,
    content: string,
    language?: string
  ): monaco.editor.ITextModel;
  getOrCreateModel(
    uri: string,
    content: string,
    language?: string
  ): monaco.editor.ITextModel;
  disposeModel(uri: string): void;
  dispose(): void;
  isInitialized(): boolean;
}

/**
 * MonacoService - Monaco Editor 통합 관리 서비스
 *
 * 설계 원칙:
 * - 싱글톤 패턴: 애플리케이션 전체에서 단일 인스턴스 사용
 * - 모델 풀링: 파일별 독립적인 편집 모델 관리
 * - 메모리 관리: 에디터와 모델의 생명주기 추적 및 정리
 * - 지연 초기화: 필요할 때만 Monaco 초기화
 *
 * 핵심 기능:
 * - Multi-model 에디터 지원 (탭별 독립 모델)
 * - TypeScript/JavaScript 지원 설정
 * - 테마 및 언어 서비스 구성
 * - 메모리 누수 방지
 */
export class MonacoService implements IMonacoEditorService {
  private static instance: MonacoService;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private models: Map<string, monaco.editor.ITextModel> = new Map(); // URI를 키로 하는 모델 풀
  private editors: Set<monaco.editor.IStandaloneCodeEditor> = new Set(); // 생성된 에디터 인스턴스 추적
  private initialized: boolean = false;

  /**
   * 싱글톤 인스턴스 획득
   *
   * 애플리케이션 전체에서 단일 Monaco 서비스 인스턴스 보장
   */
  static getInstance(): MonacoService {
    if (!MonacoService.instance) {
      MonacoService.instance = new MonacoService();
    }
    return MonacoService.instance;
  }

  /**
   * Monaco Editor 초기화
   *
   * 처리 과정:
   * 1. 중복 초기화 방지 체크
   * 2. Monaco 설정 적용
   * 3. 초기화 상태 플래그 설정
   * 4. 에러 발생 시 명확한 메시지 제공
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Monaco는 vite-plugin-monaco-editor를 통해 이미 로드됨
      this.configureMonaco();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Monaco: ${error}`);
    }
  }

  // 레거시 호환성을 위한 별칭 메서드
  async initializeMonaco(): Promise<void> {
    return this.initialize();
  }

  /**
   * Monaco Editor 설정 구성
   *
   * 설정 항목:
   * - 기본 테마: vs-dark (어두운 테마)
   * - TypeScript 컴파일러 옵션
   * - JavaScript 검증 설정
   * - JSX 지원 활성화
   */
  private configureMonaco(): void {
    // 기본 테마 설정
    monaco.editor.setTheme("vs-dark");

    // TypeScript 언어 서비스 구성
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // JavaScript 파일에 대한 검증 비활성화 (성능 향상)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  }

  /**
   * 새 에디터 인스턴스 생성
   *
   * 처리 과정:
   * 1. 초기화 상태 확인
   * 2. 기본 옵션과 사용자 옵션 병합
   * 3. Monaco 에디터 인스턴스 생성
   * 4. 생성된 에디터를 추적 목록에 추가
   */
  createEditor(
    container: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions = {}
  ): monaco.editor.IStandaloneCodeEditor {
    if (!this.initialized) {
      throw new Error(
        "MonacoService must be initialized before creating editors"
      );
    }

    const editor = monaco.editor.create(container, {
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      lineNumbers: "on",
      ...options, // 사용자 정의 옵션으로 기본값 덮어쓰기
    });

    // 생성된 에디터를 추적 목록에 추가 (메모리 관리용)
    this.editors.add(editor);

    // 에디터가 dispose될 때 자동으로 추적 목록에서 제거
    editor.onDidDispose(() => {
      this.editors.delete(editor);
    });

    return editor;
  }

  /**
   * 모델 생성 또는 업데이트
   *
   * Multi-model 에디터의 핵심 기능:
   * 1. 기존 모델이 있으면 내용만 업데이트
   * 2. 새 모델이면 언어 감지 후 생성
   * 3. 모델 풀에 등록하여 재사용 가능
   */
  createModel(path: string, content: string): monaco.editor.ITextModel {
    const existing = this.models.get(path);
    if (existing) {
      existing.setValue(content);
      return existing;
    }

    // 파일 확장자를 기반으로 언어 자동 감지
    const language = getLanguageFromFilename(path);
    const model = monaco.editor.createModel(
      content,
      language,
      monaco.Uri.file(path)
    );

    // 모델 풀에 등록 (메모리 관리 및 재사용)
    this.models.set(path, model);
    return model;
  }

  /**
   * 모델 가져오기 또는 생성 (통합 메서드)
   *
   * 처리 과정:
   * 1. 기존 모델 확인
   * 2. 내용이 다르면 업데이트
   * 3. 없으면 새로 생성
   * 4. 언어 자동 감지 지원
   */
  getOrCreateModel(
    uri: string,
    content: string,
    language?: string
  ): monaco.editor.ITextModel {
    const existing = this.models.get(uri);
    if (existing) {
      if (existing.getValue() !== content) {
        existing.setValue(content);
      }
      return existing;
    }

    const detectedLanguage = language || this.detectLanguage(uri);
    const monacoUri = monaco.Uri.parse(uri);
    const model = monaco.editor.createModel(
      content,
      detectedLanguage,
      monacoUri
    );
    this.models.set(uri, model);

    return model;
  }

  /**
   * 모델 제거 및 메모리 정리
   *
   * 탭이 닫힐 때 호출되어 메모리 누수 방지
   */
  disposeModel(uri: string): void {
    const model = this.models.get(uri);
    if (model) {
      model.dispose();
      this.models.delete(uri);
    }
  }

  // 레거시 지원 메서드들
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

  /**
   * 전체 서비스 정리
   *
   * 애플리케이션 종료 시 모든 리소스 해제
   * 메모리 누수 방지를 위한 완전한 정리 작업
   */
  dispose(): void {
    // 모든 모델 해제
    this.models.forEach((model) => model.dispose());
    this.models.clear();

    // 모든 에디터 해제
    this.editors.forEach((editor) => editor.dispose());
    this.editors.clear();

    this.editor?.dispose();
    this.editor = null;
    this.initialized = false;
  }

  private detectLanguage(uri: string): string {
    const extension = uri.split(".").pop()?.toLowerCase() || "";
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      md: "markdown",
      py: "python",
      java: "java",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    };

    return languageMap[extension] || "plaintext";
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Legacy methods for backward compatibility
  initEditor(
    container: HTMLElement,
    options?: monaco.editor.IStandaloneEditorConstructionOptions
  ): monaco.editor.IStandaloneCodeEditor {
    this.editor = this.createEditor(container, options);
    return this.editor;
  }

  setTheme(theme: string): void {
    monaco.editor.setTheme(theme);
  }

  disposeEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    if (editor && typeof editor.dispose === "function") {
      editor.dispose();
    }
  }
}
