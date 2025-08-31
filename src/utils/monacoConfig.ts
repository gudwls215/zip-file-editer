// Monaco Editor 번들 최적화를 위한 설정
// 필요한 언어만 포함하여 번들 크기 최소화

// 기본 언어들만 포함
export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "json",
  "html",
  "css",
  "scss",
  "markdown",
  "xml",
  "yaml",
  "plaintext",
];

// 워커 최적화
export const MONACO_CONFIG = {
  // 필요한 워커만 로드
  workers: {
    typescript: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/typescript/ts.worker",
          import.meta.url
        )
      ),
    css: () =>
      new Worker(
        new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url)
      ),
    html: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/html/html.worker",
          import.meta.url
        )
      ),
    json: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/json/json.worker",
          import.meta.url
        )
      ),
    default: () =>
      new Worker(
        new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url)
      ),
  },
};

// 불필요한 언어 기능 비활성화
export const EDITOR_OPTIONS = {
  // 성능 최적화 옵션
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineNumbers: "on" as const,
  roundedSelection: false,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  // 불필요한 기능 비활성화
  suggest: {
    showInlineDetails: false,
    showIcons: false,
  },
  hover: {
    enabled: false,
  },
  parameterHints: {
    enabled: false,
  },
  // 코드 렌즈 비활성화
  codeLens: false,
  // 색상 데코레이터 비활성화
  colorDecorators: false,
  // 링크 검출 비활성화
  links: false,
  // 폴딩 비활성화 (대용량 파일에서 성능 향상)
  folding: false,
  // 불필요한 검증 비활성화
  validate: false,
};
