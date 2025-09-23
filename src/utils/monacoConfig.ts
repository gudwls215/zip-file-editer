/**
 * Monaco Editor Configuration - Monaco Editor 최적화 설정
 *
 * 목적:
 * - 번들 크기 최적화 (필요한 언어만 포함)
 * - Web Worker 설정으로 메인 스레드 블로킹 방지
 * - 언어 서비스 및 기능 선택적 활성화
 *
 * 최적화 전략:
 * - Tree-shaking으로 사용하지 않는 언어 제거
 * - Worker 분리로 UI 반응성 보장
 * - CDN 로딩 대신 번들 최적화
 */

/**
 * 지원되는 언어 목록
 *
 * 선정 기준:
 * - 웹 개발에서 자주 사용되는 언어 우선
 * - ZIP 파일에서 발견될 가능성이 높은 언어
 * - Monaco Editor에서 언어 서비스 지원
 *
 * 포함 언어:
 * - 프로그래밍: javascript, typescript
 * - 마크업: html, xml, markdown
 * - 스타일: css, scss
 * - 데이터: json, yaml
 * - 기본: plaintext
 *
 * 번들 크기 영향:
 * - 각 언어마다 약 100-500KB 추가
 * - 언어 서버 Worker 별도 로딩
 */
export const SUPPORTED_LANGUAGES = [
  "javascript", // JS 프로젝트 파일
  "typescript", // TS 프로젝트 파일
  "json", // 설정 파일
  "html", // 웹페이지 마크업
  "css", // 스타일시트
  "scss", // Sass 스타일시트
  "markdown", // 문서 파일
  "xml", // XML 설정
  "yaml", // YAML 설정
  "plaintext", // 일반 텍스트
];

/**
 * Monaco Editor Worker 설정
 *
 * Worker 분리 이유:
 * - IntelliSense 처리로 메인 스레드 블로킹 방지
 * - 타입 체킹 등 무거운 작업 백그라운드 처리
 * - 사용자 입력 반응성 보장
 *
 * Worker 타입별 역할:
 * - typescript: TS/JS 언어 서비스 (타입 체킹, 자동완성)
 * - css: CSS 언어 서비스 (문법 검사, 속성 제안)
 * - html: HTML 언어 서비스 (태그 검증, 속성 완성)
 * - json: JSON 언어 서비스 (스키마 검증)
 * - default: 기본 에디터 기능 (문법 하이라이팅 등)
 */
export const MONACO_CONFIG = {
  // 언어별 Web Worker 설정
  workers: {
    // TypeScript 언어 서버 Worker
    typescript: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/typescript/ts.worker",
          import.meta.url
        )
      ),
    // CSS 언어 서버 Worker
    css: () =>
      new Worker(
        new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url)
      ),
    // HTML 언어 서버 Worker
    html: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/html/html.worker",
          import.meta.url
        )
      ),
    // JSON 언어 서버 Worker
    json: () =>
      new Worker(
        new URL(
          "monaco-editor/esm/vs/language/json/json.worker",
          import.meta.url
        )
      ),
    // 기본 에디터 Worker (문법 하이라이팅 등)
    default: () =>
      new Worker(
        new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url)
      ),
  },
};

/**
 * 성능 최적화된 에디터 옵션
 *
 * 최적화 목표:
 * - 불필요한 기능 비활성화로 메모리 사용량 감소
 * - 렌더링 성능 향상
 * - 모바일 디바이스 호환성 개선
 *
 * 비활성화된 기능들:
 * - 미니맵: 대용량 파일에서 성능 저하 요인
 * - 인라인 제안: 복잡한 UI 요소 제거
 * - 호버 정보: 마우스 오버 시 지연 방지
 * - 매개변수 힌트: 함수 호출 시 추가 UI 제거
 *
 * 유지된 기능들:
 * - 기본 편집 기능 (복사, 붙여넣기, 실행 취소)
 * - 문법 하이라이팅
 * - 라인 번호
 * - 자동 레이아웃
 */
export const EDITOR_OPTIONS = {
  // 성능 최적화 옵션
  minimap: { enabled: false }, // 미니맵 비활성화 (메모리 절약)
  automaticLayout: true, // 자동 레이아웃 조정
  scrollBeyondLastLine: false, // 마지막 줄 이후 스크롤 방지
  fontSize: 14, // 가독성 좋은 폰트 크기
  lineNumbers: "on" as const, // 라인 번호 표시
  roundedSelection: false, // 선택 영역 렌더링 최적화
  scrollbar: {
    verticalScrollbarSize: 10, // 얇은 스크롤바
    horizontalScrollbarSize: 10,
  },

  // IntelliSense 기능 최적화
  suggest: {
    showInlineDetails: false, // 인라인 세부 정보 숨김
    showIcons: false, // 제안 아이콘 비활성화
  },

  // 호버 및 힌트 비활성화 (성능 향상)
  hover: {
    enabled: false, // 마우스 호버 정보 비활성화
  },
  parameterHints: {
    enabled: false, // 매개변수 힌트 비활성화
  },

  // 추가 기능 비활성화 (경량화)
  codeLens: false, // 코드 렌즈 (참조 정보) 비활성화
  colorDecorators: false, // 색상 데코레이터 비활성화
  links: false, // 링크 자동 감지 비활성화
  folding: false, // 코드 폴딩 비활성화 (성능 향상)
  validate: false, // 실시간 문법 검증 비활성화
};
