/**
 * Constants - 애플리케이션 상수 정의
 *
 * 목적:
 * - 하드코딩된 값들을 중앙 집중화
 * - 파일 타입 판별 및 언어 매핑 제공
 * - 설정 변경의 용이성 및 유지보수성 향상
 *
 * 분류:
 * - BINARY_EXTENSIONS: 바이너리 파일 확장자
 * - IMAGE_EXTENSIONS: 이미지 파일 확장자
 * - LANGUAGE_MAP: 파일 확장자 → Monaco 언어 매핑
 */

/**
 * 바이너리 파일 확장자 집합
 *
 * 포함 카테고리:
 * - 이미지: jpg, png, gif, svg, ico 등
 * - 압축: zip, rar, 7z, tar, gz 등
 * - 실행파일: exe, dll, so, dylib 등
 * - 미디어: mp3, mp4, avi, mov 등
 * - 폰트: ttf, otf, woff, woff2 등
 * - 데이터베이스: db, sqlite 등
 *
 * 사용 목적:
 * - 텍스트 에디터에서 편집 불가능한 파일 구분
 * - 파일 업로드 시 처리 방식 결정
 * - 미리보기 컴포넌트 선택
 */
export const BINARY_EXTENSIONS = new Set([
  // 이미지 파일
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "ico",
  // 압축 파일
  "pdf",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  // 실행 파일
  "exe",
  "dll",
  "so",
  "dylib",
  // 미디어 파일
  "mp3",
  "mp4",
  "avi",
  "mov",
  "wmv",
  "flv",
  // 폰트 파일
  "ttf",
  "otf",
  "woff",
  "woff2",
  "eot",
  // 데이터베이스
  "db",
  "sqlite",
]);

/**
 * 이미지 파일 확장자 집합
 *
 * 특징:
 * - BINARY_EXTENSIONS의 부분집합
 * - 이미지 프리뷰 기능 대상 파일들
 * - 웹 브라우저에서 직접 렌더링 가능한 형식
 *
 * 활용:
 * - 이미지 뷰어 컴포넌트 활성화 조건
 * - 썸네일 생성 대상 파일 필터링
 */
export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "ico",
]);

/**
 * 파일 확장자별 Monaco Editor 언어 매핑
 *
 * 매핑 전략:
 * - 파일 확장자 → Monaco 언어 ID 변환
 * - 문법 하이라이팅 및 언어 서비스 활성화
 * - IntelliSense, 에러 검사, 자동완성 지원
 *
 * 지원 언어:
 * - 웹: js, ts, html, css, scss
 * - 백엔드: py, java, go, rust, php
 * - 시스템: c, cpp, cs
 * - 설정: json, yaml, xml
 * - 기타: md, sql, shell
 */
export const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript 계열
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",

  // 백엔드 언어들
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",

  // 시스템 프로그래밍
  c: "c",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",

  // 웹 기술
  php: "php",
  html: "html",
  htm: "html",
  xml: "xml",
  css: "css",
  scss: "scss",
  sass: "sass",
  // 스타일시트
  less: "less",

  // 설정 파일
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",

  // 문서
  md: "markdown",
  mdx: "markdown",

  // 데이터베이스
  sql: "sql",

  // 셸 스크립트
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  bat: "batch",
  cmd: "batch",

  // 컨테이너 & 빌드
  dockerfile: "dockerfile",
  makefile: "makefile",
  mk: "makefile",

  // 기타 프로그래밍 언어
  r: "r",
  scala: "scala",
  clj: "clojure",
  cljs: "clojure",
  elm: "elm",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hrl: "erlang",
};

/**
 * 파일 타입별 아이콘 매핑
 *
 * 목적:
 * - 파일 트리에서 직관적인 파일 타입 구분
 * - 확장자별 시각적 식별성 향상
 * - 사용자 경험 개선
 *
 * 분류:
 * - 기본: folder, file
 * - 언어별: javascript, typescript, python 등
 * - 설정: json, yaml 등
 * - 문서: markdown, text 등
 */
export const FILE_ICONS: Record<string, string> = {
  // 기본 아이콘
  file: "📄", // 일반 파일
  folder: "📁", // 닫힌 폴더
  "folder-open": "📂", // 열린 폴더

  // 웹 개발 파일들
  js: "📜", // JavaScript
  jsx: "⚛️", // React JSX
  ts: "📘", // TypeScript
  tsx: "⚛️", // React TSX
  json: "🗂️", // JSON 설정
  html: "🌐", // HTML 마크업
  css: "🎨", // CSS 스타일
  scss: "🎨", // Sass CSS
  sass: "🎨", // Sass CSS (indented)
  less: "🎨", // Less CSS

  // 문서 파일들
  md: "📝", // Markdown
  txt: "📄", // 텍스트
  xml: "📋", // XML

  // 설정 파일들
  yaml: "⚙️", // YAML 설정
  yml: "⚙️", // YAML 설정
  toml: "⚙️", // TOML 설정

  // 이미지 파일들
  png: "🖼️", // PNG 이미지
  jpg: "🖼️", // JPEG 이미지
  jpeg: "🖼️", // JPEG 이미지
  gif: "🖼️", // GIF 애니메이션
  svg: "🎨", // SVG 벡터
  ico: "🖼️", // 아이콘
  webp: "🖼️", // WebP 이미지
  bmp: "🖼️", // 비트맵 이미지

  // 압축 파일들
  zip: "📦", // ZIP 아카이브
  rar: "📦", // RAR 아카이브
  "7z": "📦", // 7-Zip 아카이브
  tar: "📦", // TAR 아카이브
  gz: "📦", // Gzip 압축

  // 프로그래밍 언어들
  py: "🐍", // Python
  java: "☕", // Java
  kt: "🟣", // Kotlin
  swift: "🦉", // Swift
  go: "🐹", // Go
  rs: "🦀", // Rust
  rb: "💎", // Ruby
  php: "🐘", // PHP
  cpp: "⚡", // C++
  c: "⚡", // C
  cs: "🔷", // C#

  // 스크립트 파일들
  sh: "💻", // Shell Script
  ps1: "💙", // PowerShell
  bat: "💻", // Batch Script

  // 오피스 문서들
  pdf: "📕", // PDF 문서
  doc: "📄", // Word 문서
  docx: "📄", // Word 문서
  xls: "📊", // Excel 스프레드시트
  xlsx: "📊", // Excel 스프레드시트
  ppt: "📽️", // PowerPoint 프레젠테이션
  pptx: "📽️", // PowerPoint 프레젠테이션
};

/**
 * Monaco Editor 기본 옵션
 *
 * 최적화된 에디터 설정:
 * - 성능: 빠른 렌더링 및 반응성
 * - 사용성: IDE와 유사한 기능들
 * - 접근성: 스크린 리더 지원
 * - 모바일: 터치 디바이스 대응
 */
export const DEFAULT_EDITOR_OPTIONS = {
  theme: "vs-dark", // 다크 테마 (개발자 선호도 높음)
  fontSize: 14, // 가독성 좋은 폰트 크기
  fontFamily:
    'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace', // 모노스페이스 폰트
  lineNumbers: "on" as const, // 라인 번호 표시
  wordWrap: "off" as const, // 자동 줄 바꿈 비활성화
  minimap: { enabled: true }, // 미니맵 활성화
  scrollBeyondLastLine: false, // 마지막 줄 이후 스크롤 방지
  automaticLayout: true, // 자동 레이아웃 조정
  tabSize: 2, // 탭 크기 (일반적인 웹 개발 표준)
  insertSpaces: true, // 탭 대신 스페이스 사용
  folding: true, // 코드 폴딩 활성화
  lineNumbersMinChars: 3, // 라인 번호 최소 문자 수
  scrollbar: {
    verticalScrollbarSize: 10, // 수직 스크롤바 크기
    horizontalScrollbarSize: 10, // 수평 스크롤바 크기
  },
};

/**
 * 지원되는 Monaco Editor 테마 목록
 *
 * 테마별 특징:
 * - vs-dark: 어두운 배경, 눈의 피로 감소
 * - vs-light: 밝은 배경, 인쇄용 친화적
 * - hc-black: 고대비 테마, 접근성 향상
 */
export const SUPPORTED_THEMES = [
  "vs-dark", // 다크 테마 (기본값)
  "vs-light", // 라이트 테마
  "hc-black", // 고대비 테마 (접근성)
];

/**
 * 파일 업로드 제한 상수
 *
 * 성능 및 보안 고려사항:
 * - MAX_FILE_SIZE: 메모리 사용량 제한 (50MB)
 * - MAX_FILES: UI 성능 보장을 위한 파일 개수 제한
 *
 * 브라우저 한계:
 * - 메모리 사용량 최적화
 * - 렌더링 성능 보장
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB - 개별 파일 최대 크기
export const MAX_FILES = 1000; // 1000개 - 최대 파일 개수
