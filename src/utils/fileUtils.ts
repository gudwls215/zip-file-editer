/**
 * File Utilities - 파일 처리 유틸리티 함수들
 *
 * 목적:
 * - 파일 확장자 및 언어 감지
 * - 파일 크기 포맷팅
 * - 파일 타입 분류 (텍스트/바이너리/이미지)
 * - ID 생성 및 파일 메타데이터 처리
 *
 * 설계 원칙:
 * - 순수 함수로 구성 (사이드 이펙트 없음)
 * - 성능 최적화 (캐싱 고려)
 * - 확장 가능한 구조
 * - 크로스 플랫폼 호환성
 */

/**
 * 파일명에서 확장자 추출
 *
 * 알고리즘:
 * - 마지막 점(.) 위치 검색
 * - 점이 없으면 빈 문자열 반환
 * - 대소문자 구분 없이 소문자로 정규화
 *
 * 예시:
 * - "App.tsx" → "tsx"
 * - "README" → ""
 * - "script.min.js" → "js"
 */
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot + 1).toLowerCase();
};

/**
 * 파일 확장자로부터 Monaco Editor 언어 추론
 *
 * 매핑 전략:
 * - 일반적인 파일 확장자 → Monaco 언어 ID
 * - 알 수 없는 확장자는 'plaintext'로 처리
 * - 다중 확장자 지원 (jsx → javascript)
 *
 * 성능 고려사항:
 * - Record<string, string> 사용으로 O(1) 조회
 * - 자주 사용되는 언어 우선 배치
 */
export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    // 웹 프론트엔드
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",

    // 설정 및 데이터
    json: "json",
    xml: "xml",
    md: "markdown",

    // 백엔드 언어들
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sql: "sql",

    // 스크립트
    sh: "shell",
    bat: "bat",
    ps1: "powershell",
  };

  return languageMap[extension] || "plaintext";
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 포맷팅
 *
 * 단위 변환:
 * - 1024 바이트 기준 (컴퓨터 과학 표준)
 * - B → KB → MB → GB 순서
 * - 소수점 한 자리까지 표시
 *
 * 사용 사례:
 * - 파일 트리에서 파일 크기 표시
 * - 업로드 진행률 표시
 * - 메모리 사용량 모니터링
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024; // 1024 바이트 = 1KB (바이너리 기준)
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k)); // 단위 계산

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 텍스트 파일 여부 판별
 *
 * 판별 기준:
 * - 확장자 기반 화이트리스트 방식
 * - Monaco Editor에서 편집 가능한 파일들
 * - 사람이 읽을 수 있는 텍스트 형식
 *
 * 포함 파일 타입:
 * - 프로그래밍 언어 파일들
 * - 설정 파일들 (json, yaml, toml 등)
 * - 문서 파일들 (md, txt, log 등)
 *
 * 활용:
 * - 에디터에서 편집 가능 여부 결정
 * - 파일 내용 미리보기 가능 여부
 * - ZIP 추출 시 텍스트 디코딩 적용
 */
export const isTextFile = (filename: string): boolean => {
  const textExtensions = [
    // 프로그래밍 언어
    "txt",
    "js",
    "jsx",
    "ts",
    "tsx",
    "html",
    "css",
    "scss",
    "sass",
    "json",
    "xml",
    "md",
    "py",
    "java",
    "cpp",
    "c",
    "php",
    "rb",
    "go",
    "rs",
    "sql",
    "sh",
    "bat",
    "ps1",

    // 설정 파일
    "yml",
    "yaml",
    "toml",
    "ini",
    "cfg",
    "conf",

    // 로그 및 문서
    "log",
  ];

  const extension = getFileExtension(filename);
  return textExtensions.includes(extension);
};

/**
 * 바이너리 파일 여부 판별
 *
 * 판별 기준:
 * - 텍스트 에디터에서 편집 불가능한 파일들
 * - 특수한 바이너리 형식으로 저장된 데이터
 * - 멀티미디어 및 실행 파일들
 *
 * 포함 파일 타입:
 * - 이미지, 오디오, 비디오 파일
 * - 압축 파일 및 아카이브
 * - 실행 파일 및 라이브러리
 * - 오피스 문서 (바이너리 형식)
 *
 * 처리 방식:
 * - ArrayBuffer로 읽기
 * - 바이너리 뷰어 또는 다운로드만 제공
 * - 메타데이터만 표시
 */
export const isBinaryFile = (filename: string): boolean => {
  const binaryExtensions = [
    // 이미지 파일
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "ico",
    // 문서 및 압축
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
    // 멀티미디어
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
  ];

  const extension = getFileExtension(filename);
  return binaryExtensions.includes(extension);
};

/**
 * 이미지 파일 여부 판별
 *
 * 목적:
 * - 이미지 프리뷰 기능 활성화 조건
 * - 브라우저에서 직접 렌더링 가능한 이미지 형식
 * - 썸네일 생성 대상 파일 구분
 *
 * 지원 형식:
 * - 일반 이미지: jpg, png, gif, bmp
 * - 웹 최적화: webp
 * - 벡터: svg
 * - 아이콘: ico
 *
 * 활용:
 * - 파일 뷰어에서 이미지 컴포넌트 렌더링
 * - 드래그 앤 드롭 시 이미지 프리뷰
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "ico",
  ];

  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

/**
 * 파일명으로부터 Monaco Editor 언어 추론 (wrapper 함수)
 *
 * 편의성:
 * - 파일명 → 확장자 → 언어의 과정을 한 번에 처리
 * - getFileExtension + getLanguageFromExtension 조합
 *
 * 사용 사례:
 * - 에디터 탭 생성 시 언어 설정
 * - 파일 열기 시 문법 하이라이팅 적용
 */
export const getLanguageFromFilename = (filename: string): string => {
  const extension = getFileExtension(filename);
  return getLanguageFromExtension(extension);
};

/**
 * 고유한 파일 ID 생성
 *
 * 알고리즘:
 * - Math.random() 기반 36진수 문자열
 * - 9자리 길이로 충돌 확률 최소화
 * - 클라이언트 사이드에서 즉시 생성 가능
 *
 * 용도:
 * - 파일 목록에서 key prop으로 사용
 * - 에디터 탭 식별자
 * - 파일 맵핑 및 참조
 *
 * 한계:
 * - 완전한 고유성 보장하지 않음 (확률적)
 * - 서버 환경에서는 UUID 사용 권장
 */
export const generateFileId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * ArrayBuffer를 Base64 문자열로 변환
 *
 * 사용 목적:
 * - 바이너리 데이터를 텍스트로 인코딩
 * - 웹 저장소나 JSON에 바이너리 저장
 * - 네트워크 전송을 위한 인코딩
 *
 * 변환 과정:
 * 1. ArrayBuffer → Uint8Array
 * 2. 각 바이트를 문자로 변환
 * 3. btoa()로 Base64 인코딩
 *
 * 성능 고려사항:
 * - 대용량 파일의 경우 메모리 사용량 주의
 * - 스트림 처리 고려 필요
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Base64 문자열을 ArrayBuffer로 변환
 *
 * 역변환 과정:
 * 1. atob()로 Base64 디코딩
 * 2. 문자열을 바이트 배열로 변환
 * 3. ArrayBuffer로 반환
 *
 * 활용:
 * - 저장된 바이너리 데이터 복원
 * - 네트워크에서 받은 인코딩된 데이터 처리
 * - Blob 생성을 위한 데이터 준비
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * 파일 확장자별 MIME 타입 반환
 *
 * 목적:
 * - HTTP 응답 헤더 설정
 * - 브라우저의 올바른 파일 처리 유도
 * - 다운로드 시 파일 타입 명시
 *
 * 지원 타입:
 * - 텍스트: text/plain, text/javascript, text/html
 * - 이미지: image/jpeg, image/png, image/gif
 * - 설정: application/json, text/yaml
 * - 기본값: application/octet-stream (바이너리)
 */
export const getMimeType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    // 텍스트 파일
    txt: "text/plain",
    js: "text/javascript",
    ts: "text/typescript",
    tsx: "text/typescript",
    jsx: "text/javascript",
    html: "text/html",
    css: "text/css",
    json: "application/json",
    xml: "application/xml",
    md: "text/markdown",
    py: "text/x-python",
    java: "text/x-java",
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    h: "text/x-chdr",
    php: "text/x-php",
    rb: "text/x-ruby",
    go: "text/x-go",
    // 스크립트 언어
    rs: "text/x-rust",
    sh: "text/x-shellscript",
    sql: "text/x-sql",

    // 설정 파일
    yaml: "text/yaml",
    yml: "text/yaml",
    toml: "text/toml",
    ini: "text/plain",
    conf: "text/plain",
    log: "text/plain",

    // 이미지 파일
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",

    // 압축 및 문서
    zip: "application/zip",
    pdf: "application/pdf",
  };

  return mimeTypes[ext] || "application/octet-stream"; // 기본값: 바이너리 스트림
};

/**
 * 유효한 파일명인지 검증
 *
 * 검증 기준:
 * - 비어있지 않은 문자열
 * - 운영체제별 금지 문자 제외
 * - Windows 예약어 제외
 * - 점(.)이나 공백으로 끝나지 않음
 *
 * 금지 문자:
 * - < > : " / \ | ? * (Windows/Linux 공통)
 * - 제어 문자 (0x00-0x1f)
 *
 * Windows 예약어:
 * - CON, PRN, AUX, NUL
 * - COM1-COM9, LPT1-LPT9
 */
export const isValidFileName = (name: string): boolean => {
  if (!name || name.trim() === "") return false;

  // 금지 문자 검사
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(name)) return false;

  // Windows 예약어 검사
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  if (reservedNames.includes(name.toUpperCase())) return false;

  // 점이나 공백으로 끝나는 경우 검사
  if (name.endsWith(".") || name.endsWith(" ")) return false;

  return true;
};

/**
 * 파일명을 안전한 형태로 정제
 *
 * 정제 과정:
 * 1. 금지 문자를 언더스코어(_)로 치환
 * 2. 앞뒤 점과 공백 제거
 * 3. 빈 문자열인 경우 'untitled'로 대체
 *
 * 사용 사례:
 * - 사용자 입력 파일명 정제
 * - 외부에서 가져온 파일명 안전화
 * - 새 파일 생성 시 기본 이름 보장
 */
export const sanitizeFileName = (name: string): string => {
  if (!name) return "untitled";

  // 금지 문자를 언더스코어로 치환
  let sanitized = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // 앞뒤 점과 공백 제거
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // 빈 문자열 방지
  if (!sanitized) sanitized = "untitled";

  return sanitized;
};

/**
 * 확장자를 제외한 파일명 반환
 *
 * 용도:
 * - 파일 이름 변경 시 확장자 보존
 * - 파일명 기반 ID 생성
 * - 템플릿 파일명 생성
 *
 * 처리 로직:
 * - 마지막 점(.) 위치 찾기
 * - 점이 첫 번째 문자가 아닌 경우만 처리 (.gitignore 보호)
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
};

/**
 * 경로 세그먼트들을 안전하게 결합
 *
 * 정규화 과정:
 * 1. 빈 세그먼트 제거
 * 2. 앞뒤 슬래시 제거
 * 3. 슬래시로 결합
 * 4. 중복 슬래시 정리
 *
 * 크로스 플랫폼:
 * - 항상 '/' 사용 (웹 표준)
 * - Windows 백슬래시 호환성 고려
 */
export const joinPath = (...parts: string[]): string => {
  return parts
    .filter((part) => part && part.length > 0) // 빈 부분 제거
    .map((part) => part.replace(/^\/+|\/+$/g, "")) // 앞뒤 슬래시 제거
    .join("/") // 슬래시로 결합
    .replace(/\/+/g, "/"); // 중복 슬래시 정리
};

/**
 * 상위 디렉토리 경로 반환
 *
 * 처리 방식:
 * - 경로를 '/'로 분할
 * - 마지막 세그먼트 제거
 * - 남은 부분을 다시 결합
 *
 * 예시:
 * - "src/components/App.tsx" → "src/components"
 * - "README.md" → ""
 */
export const getParentPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
};

/**
 * 경로에서 파일명만 추출
 *
 * 추출 방식:
 * - 경로를 '/'로 분할
 * - 마지막 세그먼트 반환
 *
 * 예시:
 * - "src/components/App.tsx" → "App.tsx"
 * - "README.md" → "README.md"
 */
export const getFileName = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};
