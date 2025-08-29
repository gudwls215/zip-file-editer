export const SUPPORTED_FILE_TYPES = [
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const EDITOR_THEMES = {
  LIGHT: 'vs',
  DARK: 'vs-dark',
  HIGH_CONTRAST: 'hc-black'
} as const;

export const FILE_ICONS = {
  folder: '📁',
  folderOpen: '📂',
  file: '📄',
  javascript: '📜',
  typescript: '📘',
  html: '🌐',
  css: '🎨',
  json: '🔧',
  markdown: '📝',
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  archive: '📦',
  unknown: '❓'
} as const;

export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  OPEN: 'Ctrl+O',
  CLOSE_TAB: 'Ctrl+W',
  NEW_TAB: 'Ctrl+T',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  SEARCH: 'Ctrl+F',
  REPLACE: 'Ctrl+H'
} as const;
