export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
};

export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    xml: 'xml',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    sh: 'shell',
    bat: 'bat',
    ps1: 'powershell',
  };
  
  return languageMap[extension] || 'plaintext';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isTextFile = (filename: string): boolean => {
  const textExtensions = [
    'txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
    'json', 'xml', 'md', 'py', 'java', 'cpp', 'c', 'php', 'rb',
    'go', 'rs', 'sql', 'sh', 'bat', 'ps1', 'yml', 'yaml', 'toml',
    'ini', 'cfg', 'conf', 'log'
  ];
  
  const extension = getFileExtension(filename);
  return textExtensions.includes(extension);
};

export const isBinaryFile = (filename: string): boolean => {
  const binaryExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico',
    'pdf', 'zip', 'rar', '7z', 'tar', 'gz',
    'exe', 'dll', 'so', 'dylib',
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    'db', 'sqlite'
  ];
  
  const extension = getFileExtension(filename);
  return binaryExtensions.includes(extension);
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'
  ];
  
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

export const getLanguageFromFilename = (filename: string): string => {
  const extension = getFileExtension(filename);
  return getLanguageFromExtension(extension);
};

export const generateFileId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const getMimeType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    js: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    html: 'text/html',
    css: 'text/css',
    json: 'application/json',
    xml: 'application/xml',
    md: 'text/markdown',
    py: 'text/x-python',
    java: 'text/x-java',
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    h: 'text/x-chdr',
    php: 'text/x-php',
    rb: 'text/x-ruby',
    go: 'text/x-go',
    rs: 'text/x-rust',
    sh: 'text/x-shellscript',
    sql: 'text/x-sql',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    toml: 'text/toml',
    ini: 'text/plain',
    conf: 'text/plain',
    log: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    zip: 'application/zip',
    pdf: 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export const isValidFileName = (name: string): boolean => {
  if (!name || name.trim() === '') return false;
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(name)) return false;
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(name.toUpperCase())) return false;
  
  // Check for names ending with a dot or space
  if (name.endsWith('.') || name.endsWith(' ')) return false;
  
  return true;
};

export const sanitizeFileName = (name: string): string => {
  if (!name) return 'untitled';
  
  // Replace invalid characters with underscores
  let sanitized = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Ensure it's not empty
  if (!sanitized) sanitized = 'untitled';
  
  return sanitized;
};

export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
};

export const joinPath = (...parts: string[]): string => {
  return parts
    .filter(part => part && part.length > 0)
    .map(part => part.replace(/^\/+|\/+$/g, ''))
    .join('/')
    .replace(/\/+/g, '/');
};

export const getParentPath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
};

export const getFileName = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};
