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

export const generateFileId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
