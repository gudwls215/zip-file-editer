import { create } from "zustand";
import JSZip from "jszip";

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string | Uint8Array;
  isExpanded?: boolean;
}

interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean; // 수정 여부 - do/undo 상태 관리의 핵심
}

interface ZipStore {
  // ZIP 관련 상태
  zipFile: JSZip | null; // 현재 로드된 ZIP 파일 객체
  fileName: string | null; // ZIP 파일명
  originalBuffer: ArrayBuffer | null; // 원본 ZIP 데이터 (되돌리기용)
  fileTree: FileNode[]; // 파일 트리 구조
  // 저장된 변경사항 스냅샷 (Ctrl+S 시 저장됨) - do/undo의 저장 지점
  savedChanges: Record<string, string>;
  // 구조적 변경사항 추적 (파일/폴더 추가/삭제) - 전체적인 undo 범위
  hasStructuralChanges: boolean;

  // 에디터 상태
  tabs: EditorTab[]; // 열린 탭들
  activeTabId: string | null; // 활성 탭 ID

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // 액션들
  setZipData: (data: {
    zipFile: JSZip;
    fileName: string;
    originalBuffer: ArrayBuffer;
  }) => void;
  setFileTree: (tree: FileNode[]) => void;
  addTab: (tab: EditorTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void; // do/undo 히스토리 생성
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // 저장된 변경사항 액션들 - do/undo 저장 지점 관리
  setSavedChange: (path: string, content: string) => void;
  removeSavedChange: (path: string) => void;
  clearSavedChanges: () => void;
  saveFile: (path: string, content: string) => void; // 파일 저장 시 do/undo 상태 리셋
  // 파일/폴더 변경 액션들 - 구조적 undo 지점 생성
  addFolder: (parentPath: string | null, folderName: string) => void;
  addFile: (
    parentPath: string | null,
    fileName: string,
    content?: string
  ) => void;
  deletePath: (path: string) => void;
  reset: () => void;
}

export const useZipStore = create<ZipStore>((set, get) => ({
  // 초기 상태
  zipFile: null,
  fileName: null,
  originalBuffer: null,
  fileTree: [],
  savedChanges: {}, // do/undo의 저장 지점들을 기록
  hasStructuralChanges: false, // 구조적 변경사항 플래그 (전체 undo 범위)
  tabs: [],
  activeTabId: null,
  isLoading: false,
  error: null,

  // 액션들
  setZipData: ({ zipFile, fileName, originalBuffer }) => {
    // 새로운 ZIP 파일 로드 시 모든 상태 초기화 (do/undo 히스토리도 초기화)
    set({
      zipFile,
      fileName,
      originalBuffer,
      error: null,
      savedChanges: {}, // 저장된 변경사항 초기화
      hasStructuralChanges: false, // 구조적 변경사항 초기화
      // 기존 탭들과 에디터 상태 초기화 (do/undo 상태도 함께 초기화)
      tabs: [],
      activeTabId: null,
    });

    // 파일 트리 구성
    const tree = buildFileTree(zipFile);
    set({ fileTree: tree });
  },

  setFileTree: (tree) => set({ fileTree: tree }),

  addTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find((t) => t.path === tab.path);

    if (existingTab) {
      // 이미 열린 탭이 있으면 활성화 (do/undo 히스토리도 해당 탭의 것으로 전환)
      set({ activeTabId: existingTab.id });
    } else {
      // 새 탭 추가 (새로운 do/undo 히스토리 시작)
      set({
        tabs: [...tabs, tab],
        activeTabId: tab.id,
      });
    }
  },

  removeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);

    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      // 활성 탭이 닫히면 다른 탭으로 전환 (do/undo 히스토리도 전환)
      newActiveTabId =
        newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }), // 탭 전환 시 do/undo 히스토리도 전환

  updateTabContent: (tabId, content) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            content,
            isDirty: true, // 콘텐츠 변경 시 더티 상태로 설정 (do/undo 가능 상태)
          }
        : tab
    );
    set({ tabs: updatedTabs });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // 파일/폴더 변경 액션들 - 구조적 변경사항 추적
  addFolder: (parentPath, folderName) => {
    const { zipFile } = get();
    if (!zipFile) return;
    const sanitized = folderName.trim().replace(/\/+$/, "");
    if (!sanitized) return;

    const fullPath =
      parentPath && parentPath.length > 0
        ? `${parentPath}/${sanitized}`
        : sanitized;

    // 고유한 이름 보장
    let candidate = fullPath;
    let counter = 1;
    while (zipHasAny(zipFile, `${candidate}/`)) {
      candidate = `${fullPath}-${counter++}`;
    }

    zipFile.folder(`${candidate}`);
    // 트리 재구성 및 확장 상태 보존
    const prev = get().fileTree;
    const rebuilt = buildFileTree(zipFile);
    set({
      fileTree: mergeExpansionState(prev, rebuilt),
      hasStructuralChanges: true, // 구조적 변경사항 발생 (undo 가능한 지점)
    });
  },

  addFile: (parentPath, fileName, content = "") => {
    const { zipFile } = get();
    if (!zipFile) return;
    const sanitized = fileName.trim().replace(/\/+$/, "");
    if (!sanitized) return;

    const basePath =
      parentPath && parentPath.length > 0 ? `${parentPath}/` : "";
    const fullBase = `${basePath}${sanitized}`;

    // 고유한 이름 보장
    let candidate = fullBase;
    let counter = 1;
    const extMatch = sanitized.match(/^(.*?)(\.[^.]*)?$/);
    const namePart = extMatch?.[1] ?? sanitized;
    const extPart = extMatch?.[2] ?? "";
    while (zipHasExact(zipFile, candidate)) {
      candidate = `${basePath}${namePart}-${counter++}${extPart}`;
    }

    zipFile.file(candidate, content);
    // 트리 재구성 및 확장 상태 보존
    const prev = get().fileTree;
    const rebuilt = buildFileTree(zipFile);
    set({
      fileTree: mergeExpansionState(prev, rebuilt),
      hasStructuralChanges: true, // 새 파일 추가로 인한 구조적 변경사항
    });
  },

  deletePath: (path) => {
    const { zipFile } = get();
    if (!zipFile) return;
    const folderPrefix = `${path}/`;
    const isFolder =
      !!zipFile.files[`${path}/`] ||
      Object.keys(zipFile.files).some((p) => p.startsWith(folderPrefix));

    if (isFolder) {
      // 폴더 삭제 시 하위의 모든 파일도 함께 제거
      Object.keys(zipFile.files)
        .filter((p) => p === folderPrefix || p.startsWith(folderPrefix))
        .forEach((p) => zipFile.remove(p));
    } else {
      // 단일 파일 삭제
      zipFile.remove(path);
    }

    // 삭제된 경로에 대한 저장된 변경사항도 정리 (do/undo 히스토리 정리)
    set((state) => {
      const newSaved: Record<string, string> = {};
      const prefix = isFolder ? `${path}/` : null;
      for (const [k, v] of Object.entries(state.savedChanges)) {
        if (prefix) {
          if (!(k === path || k.startsWith(prefix))) newSaved[k] = v;
        } else {
          if (k !== path) newSaved[k] = v;
        }
      }
      return { savedChanges: newSaved } as Partial<ZipStore>;
    });

    // 트리 재구성 및 확장 상태 보존
    const prev = get().fileTree;
    const rebuilt = buildFileTree(zipFile);
    set({
      fileTree: mergeExpansionState(prev, rebuilt),
      hasStructuralChanges: true, // 삭제로 인한 구조적 변경사항
    });
  },

  // 저장된 변경사항 액션들 - do/undo의 저장 지점 관리
  setSavedChange: (path, content) => {
    set((state) => ({
      savedChanges: { ...state.savedChanges, [path]: content }, // 특정 파일의 저장 지점 설정
    }));
  },
  removeSavedChange: (path) => {
    const { savedChanges } = get();
    if (path in savedChanges) {
      // 해당 파일의 저장 지점 제거 (do/undo 히스토리에서 제외)
      const { [path]: _, ...rest } = savedChanges;
      set({ savedChanges: rest });
    }
  },
  clearSavedChanges: () => set({ savedChanges: {} }), // 모든 저장 지점 초기화 (전체 do/undo 히스토리 리셋)

  saveFile: (path, content) => {
    // 파일을 저장할 때 savedChanges에 반영하고, 에디터 탭의 isDirty 상태 업데이트
    // 이 시점이 새로운 do/undo 저장 지점이 됨
    set((state) => ({
      savedChanges: { ...state.savedChanges, [path]: content },
    }));

    // EditorStore의 markTabSaved 호출하여 isDirty 상태 업데이트 (do/undo 상태 동기화)
    import("./editorStore").then(({ useEditorStore }) => {
      const editorStore = useEditorStore.getState();
      const tab = editorStore.tabs.find((t) => t.path === path);
      if (tab) {
        editorStore.markTabSaved(tab.id);
      }
    });
  },

  reset: () =>
    set({
      // 모든 상태 초기화 (전체 do/undo 히스토리 완전 초기화)
      zipFile: null,
      fileName: null,
      originalBuffer: null,
      fileTree: [],
      savedChanges: {},
      hasStructuralChanges: false,
      tabs: [],
      activeTabId: null,
      isLoading: false,
      error: null,
    }),
}));

// JSZip에서 파일 트리를 구성하는 헬퍼 함수
function buildFileTree(zip: JSZip): FileNode[] {
  const tree: FileNode[] = [];
  const pathMap = new Map<string, FileNode>();

  // 첫 번째 패스: 모든 노드 생성
  Object.keys(zip.files).forEach((path) => {
    const file = zip.files[path];
    const segments = path.split("/").filter((s) => s.length > 0);

    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      if (!pathMap.has(currentPath)) {
        const isLastSegment = i === segments.length - 1;
        const isFile = isLastSegment && !file.dir;

        const node: FileNode = {
          id: currentPath,
          name: segment,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          isExpanded: false, // 기본적으로 폴더는 접힌 상태
        };

        pathMap.set(currentPath, node);

        if (parentPath) {
          const parent = pathMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          tree.push(node);
        }
      }
    }
  });

  return tree;
}

// 이전 트리의 확장 상태를 새 트리에 병합하는 함수 (사용자 경험 향상)
function mergeExpansionState(
  oldTree: FileNode[],
  newTree: FileNode[]
): FileNode[] {
  const expanded = new Set<string>();
  // 이전 트리에서 확장된 노드들 수집
  const collect = (nodes: FileNode[]) => {
    for (const n of nodes) {
      if (n.isExpanded) expanded.add(n.path);
      if (n.children && n.children.length) collect(n.children);
    }
  };
  collect(oldTree);

  // 새 트리에 확장 상태 적용
  const apply = (nodes: FileNode[]): FileNode[] =>
    nodes.map((n) => ({
      ...n,
      isExpanded: expanded.has(n.path) || false,
      children: n.children ? apply(n.children) : undefined,
    }));

  return apply(newTree);
}

// 내부 헬퍼 함수들
function zipHasExact(zip: JSZip, fullPath: string): boolean {
  return !!zip.files[fullPath];
}
function zipHasAny(zip: JSZip, folderWithSlash: string): boolean {
  // 폴더의 경우, JSZip은 생성되거나 파일에 의해 암시된 경우 'folder/'와 같은 엔트리를 유지
  return Object.prototype.hasOwnProperty.call(zip.files, folderWithSlash);
}

// 파일 언어를 결정하는 헬퍼 함수
export function getFileLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const fullName = fileName.toLowerCase();

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    es6: "javascript",
    es: "javascript",
    ts: "typescript",
    tsx: "typescript",
    vue: "javascript",
    svelte: "javascript",

    // Python
    py: "python",
    pyi: "python",
    pyw: "python",
    pyx: "python",
    pxd: "python",
    pxi: "python",

    // Java & JVM Languages
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    groovy: "groovy",
    gradle: "groovy",
    clj: "clojure",
    cljs: "clojure",
    cljc: "clojure",

    // C/C++
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    "c++": "cpp",
    h: "c",
    hpp: "cpp",
    hxx: "cpp",
    hh: "cpp",
    "h++": "cpp",

    // C#/.NET
    cs: "csharp",
    csx: "csharp",
    cake: "csharp",
    vb: "vb",
    fs: "fsharp",
    fsx: "fsharp",
    fsi: "fsharp",

    // Web Technologies
    html: "html",
    htm: "html",
    xhtml: "html",
    shtml: "html",
    jsp: "html",
    asp: "html",
    aspx: "html",
    erb: "html",
    ejs: "html",
    hbs: "handlebars",
    handlebars: "handlebars",
    mustache: "handlebars",
    twig: "twig",

    // CSS and Preprocessors
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    styl: "stylus",
    stylus: "stylus",

    // PHP
    php: "php",
    php3: "php",
    php4: "php",
    php5: "php",
    php7: "php",
    php8: "php",
    phtml: "php",
    phps: "php",

    // Ruby
    rb: "ruby",
    rbw: "ruby",
    rake: "ruby",
    thor: "ruby",
    jbuilder: "ruby",

    // Go
    go: "go",
    mod: "go",
    sum: "plaintext",

    // Rust
    rs: "rust",
    rlib: "rust",

    // Swift & Objective-C
    swift: "swift",
    m: "objective-c",
    mm: "objective-c",

    // Other Popular Languages
    dart: "dart",
    r: "r",
    rmd: "r",
    matlab: "matlab",
    pl: "perl",
    pm: "perl",
    t: "perl",
    lua: "lua",
    tcl: "tcl",
    tk: "tcl",
    pascal: "pascal",
    pp: "pascal",
    dpr: "pascal",
    lpr: "pascal",

    // Shell Scripts
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    ksh: "shell",
    csh: "shell",
    tcsh: "shell",
    ps1: "powershell",
    psm1: "powershell",
    psd1: "powershell",
    bat: "bat",
    cmd: "bat",

    // Data & Config Files
    json: "json",
    json5: "json",
    jsonc: "json",
    xml: "xml",
    xsl: "xml",
    xslt: "xml",
    xsd: "xml",
    dtd: "xml",
    rss: "xml",
    atom: "xml",
    plist: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    ini: "ini",
    cfg: "ini",
    conf: "ini",
    config: "ini",
    properties: "properties",
    env: "plaintext",
    environ: "plaintext",

    // Documentation
    md: "markdown",
    markdown: "markdown",
    mdown: "markdown",
    mkd: "markdown",
    rst: "restructuredtext",
    rest: "restructuredtext",
    tex: "latex",
    latex: "latex",
    ltx: "latex",
    sty: "latex",
    cls: "latex",
    txt: "plaintext",
    text: "plaintext",
    log: "plaintext",
    out: "plaintext",
    readme: "plaintext",
    changelog: "plaintext",
    authors: "plaintext",
    contributors: "plaintext",
    copying: "plaintext",
    license: "plaintext",
    install: "plaintext",
    news: "plaintext",
    todo: "plaintext",

    // SQL
    sql: "sql",
    mysql: "sql",
    pgsql: "sql",
    plsql: "sql",
    psql: "sql",

    // Docker/DevOps
    dockerfile: "dockerfile",
    docker: "dockerfile",
    dockerignore: "plaintext",
    containerfile: "dockerfile",
    k8s: "yaml",
    kustomization: "yaml",

    // Version Control
    gitignore: "plaintext",
    gitattributes: "plaintext",
    gitmodules: "plaintext",
    gitkeep: "plaintext",
    hgignore: "plaintext",
    bzrignore: "plaintext",

    // Editor/IDE Config
    editorconfig: "ini",
    eslintrc: "json",
    tslintrc: "json",
    prettierrc: "json",
    stylelintrc: "json",
    babelrc: "json",
    browserslistrc: "plaintext",
    nvmrc: "plaintext",
    yarnrc: "plaintext",
    npmrc: "plaintext",

    // Package Managers & Build Tools
    tsconfig: "json",
    jsconfig: "json",
    package: "json",
    composer: "json",
    cargo: "toml",
    gemfile: "ruby",
    podfile: "ruby",
    cartfile: "plaintext",
    brewfile: "ruby",
    pipfile: "toml",
    poetry: "toml",
    requirements: "plaintext",
    setup: "python",
    makefile: "makefile",
    cmake: "cmake",
    cmakelists: "cmake",
    build: "groovy",
    ant: "xml",
    maven: "xml",
    pom: "xml",
    sbt: "scala",

    // Web & Mobile Development
    lock: "json",
    manifest: "json",
    webmanifest: "json",
    appcache: "plaintext",
    htaccess: "plaintext",
    htpasswd: "plaintext",
    robots: "plaintext",
    sitemap: "xml",

    // Graphics & Design (text-based)
    svg: "xml",
    eps: "postscript",
    ps: "postscript",

    // Others
    asm: "asm",
    s: "asm",
    nasm: "asm",
    masm: "asm",
    vim: "vim",
    vimrc: "vim",
    tmux: "plaintext",
    zshrc: "shell",
    bashrc: "shell",
    profile: "shell",
    aliases: "shell",
    functions: "shell",
  };

  // 확장자로 확인 (파일명 기반)
  const nameWithoutExt = fullName.replace(/\.[^.]*$/, "");
  if (languageMap[nameWithoutExt]) {
    return languageMap[nameWithoutExt];
  }

  // 확장자로 확인
  return languageMap[ext] || "plaintext";
}

// 바이너리 파일인지 확인하는 헬퍼 함수
export function isBinaryFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const fullName = fileName.toLowerCase();

  // 이미지 파일들 (SVG 제외 - 텍스트로 편집 가능)
  const binaryImageExtensions = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "ico",
    "tiff",
    "tif",
    "avif",
    "heic",
    "heif",
    "raw",
    "cr2",
    "nef",
    "arw",
    "dng",
  ];

  // 오디오/비디오 파일들
  const mediaExtensions = [
    "mp3",
    "mp4",
    "wav",
    "avi",
    "mov",
    "mkv",
    "flv",
    "wmv",
    "webm",
    "m4a",
    "aac",
    "ogg",
    "flac",
    "wma",
    "m4v",
    "3gp",
    "mpg",
    "mpeg",
    "ogv",
  ];

  // 압축 파일들
  const archiveExtensions = [
    "zip",
    "rar",
    "7z",
    "tar",
    "gz",
    "bz2",
    "xz",
    "lzma",
    "cab",
    "msi",
    "deb",
    "rpm",
    "dmg",
    "iso",
    "img",
  ];

  // 문서 파일들 (바이너리 형식)
  const binaryDocumentExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "odt",
    "ods",
    "odp",
    "pages",
    "numbers",
    "key",
  ];

  // 실행 파일 및 컴파일된 파일들
  const executableExtensions = [
    "exe",
    "dll",
    "so",
    "dylib",
    "app",
    "deb",
    "rpm",
    "msi",
    "pkg",
    "bin",
    "run",
    "command",
    "com",
    "scr",
    "class",
    "jar",
    "war",
    "ear",
    "pyc",
    "pyo",
    "o",
    "obj",
    "lib",
    "a",
  ];

  // 폰트 파일들
  const fontExtensions = ["ttf", "otf", "woff", "woff2", "eot", "fon", "fnt"];

  // 데이터베이스 파일들
  const databaseExtensions = ["db", "sqlite", "sqlite3", "mdb", "accdb", "dbf"];

  // 디자인 파일들
  const designExtensions = ["psd", "ai", "sketch", "fig", "xd", "swf", "fla"];

  const strictlyBinaryExtensions = [
    ...binaryImageExtensions,
    ...mediaExtensions,
    ...archiveExtensions,
    ...binaryDocumentExtensions,
    ...executableExtensions,
    ...fontExtensions,
    ...databaseExtensions,
    ...designExtensions,
  ];

  // 확장자로 확인 - 명확한 바이너리 파일들만
  if (strictlyBinaryExtensions.includes(ext)) {
    return true;
  }

  // 특별한 경우: 바이너리로 오해될 수 있지만 실제로는 텍스트인 파일들
  const textFilenames = [
    "readme",
    "license",
    "changelog",
    "authors",
    "contributors",
    "copying",
    "install",
    "news",
    "todo",
    "makefile",
    "dockerfile",
    "vagrantfile",
    "gemfile",
    "rakefile",
    "procfile",
    "gruntfile",
    "gulpfile",
    "cmakelists",
  ];

  if (textFilenames.includes(fullName.replace(/\.[^.]*$/, ""))) {
    return false;
  }

  // 확장자가 없거나 설정 파일 같은 확장자를 가진 파일들은 대부분 텍스트
  if (!ext || ext.length > 5) {
    return false;
  }

  // 확실하지 않으면 기본적으로 텍스트로 처리
  return false;
}

// 이미지 파일인지 확인하는 헬퍼 함수
export function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  // SVG는 XML이므로 텍스트로 편집 가능하여 제외
  const imageExtensions = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "ico",
    "tiff",
    "tif",
    "avif",
    "heic",
    "heif",
  ];
  return imageExtensions.includes(ext);
}

// 편집 가능한 텍스트 파일인지 확인하는 헬퍼 함수
export function isEditableFile(fileName: string): boolean {
  // 바이너리가 아니면 편집 가능할 가능성이 높음
  if (!isBinaryFile(fileName)) {
    return true;
  }

  // SVG는 기술적으로 XML이므로 텍스트로 편집 가능
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "svg") {
    return true;
  }

  return false;
}

// 파일 타입 카테고리를 가져오는 헬퍼 함수
export function getFileCategory(fileName: string): "text" | "image" | "binary" {
  if (isImageFile(fileName)) {
    return "image";
  }

  if (isBinaryFile(fileName)) {
    return "binary";
  }

  return "text";
}

// 파일 내용을 텍스트로 로드해야 하는지 결정하는 헬퍼 함수
export function shouldLoadAsText(fileName: string): boolean {
  const category = getFileCategory(fileName);

  // 텍스트 파일과 SVG 파일을 텍스트로 로드
  if (category === "text") {
    return true;
  }

  // SVG는 이미지이지만 텍스트로 편집 가능
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "svg") {
    return true;
  }

  return false;
}
