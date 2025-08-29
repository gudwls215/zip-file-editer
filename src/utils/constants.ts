// src/utils/constants.ts
export const BINARY_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico',
  'pdf', 'zip', 'rar', '7z', 'tar', 'gz',
  'exe', 'dll', 'so', 'dylib',
  'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'db', 'sqlite'
]);

export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'
]);

export const LANGUAGE_MAP: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'java': 'java',
  'kt': 'kotlin',
  'swift': 'swift',
  'c': 'c',
  'cpp': 'cpp',
  'cxx': 'cpp',
  'cc': 'cpp',
  'h': 'c',
  'hpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'html': 'html',
  'htm': 'html',
  'xml': 'xml',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'md': 'markdown',
  'mdx': 'markdown',
  'sql': 'sql',
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'fish': 'shell',
  'ps1': 'powershell',
  'bat': 'batch',
  'cmd': 'batch',
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'mk': 'makefile',
  'r': 'r',
  'scala': 'scala',
  'clj': 'clojure',
  'cljs': 'clojure',
  'elm': 'elm',
  'ex': 'elixir',
  'exs': 'elixir',
  'erl': 'erlang',
  'hrl': 'erlang'
};

export const FILE_ICONS: Record<string, string> = {
  // Default
  'file': '📄',
  'folder': '📁',
  'folder-open': '📂',
  
  // Common file types
  'js': '📜',
  'jsx': '⚛️',
  'ts': '📘',
  'tsx': '⚛️',
  'json': '🗂️',
  'html': '🌐',
  'css': '🎨',
  'scss': '🎨',
  'sass': '🎨',
  'less': '🎨',
  'md': '📝',
  'txt': '📄',
  'xml': '📋',
  'yaml': '⚙️',
  'yml': '⚙️',
  'toml': '⚙️',
  
  // Images
  'png': '🖼️',
  'jpg': '🖼️',
  'jpeg': '🖼️',
  'gif': '🖼️',
  'svg': '🎨',
  'ico': '🖼️',
  'webp': '🖼️',
  'bmp': '🖼️',
  
  // Archives
  'zip': '📦',
  'rar': '📦',
  '7z': '📦',
  'tar': '📦',
  'gz': '📦',
  
  // Programming languages
  'py': '🐍',
  'java': '☕',
  'kt': '🟣',
  'swift': '🦉',
  'go': '🐹',
  'rs': '🦀',
  'rb': '💎',
  'php': '🐘',
  'cpp': '⚡',
  'c': '⚡',
  'cs': '🔷',
  'sh': '💻',
  'ps1': '💙',
  'bat': '💻',
  
  // Other
  'pdf': '📕',
  'doc': '📄',
  'docx': '📄',
  'xls': '📊',
  'xlsx': '📊',
  'ppt': '📽️',
  'pptx': '📽️'
};

export const DEFAULT_EDITOR_OPTIONS = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
  lineNumbers: 'on' as const,
  wordWrap: 'off' as const,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  folding: true,
  lineNumbersMinChars: 3,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10
  }
};

export const SUPPORTED_THEMES = [
  'vs-dark',
  'vs-light',
  'hc-black'
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 1000;
