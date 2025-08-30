import { create } from 'zustand';
import JSZip from 'jszip';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
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
  isDirty: boolean;
}

interface ZipStore {
  // ZIP related state
  zipFile: JSZip | null;
  fileName: string | null;
  originalBuffer: ArrayBuffer | null;
  fileTree: FileNode[];
  // Saved changes snapshot (persisted on Ctrl+S)
  savedChanges: Record<string, string>;
  
  // Editor state
  tabs: EditorTab[];
  activeTabId: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setZipData: (data: { zipFile: JSZip; fileName: string; originalBuffer: ArrayBuffer }) => void;
  setFileTree: (tree: FileNode[]) => void;
  addTab: (tab: EditorTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Saved changes actions
  setSavedChange: (path: string, content: string) => void;
  removeSavedChange: (path: string) => void;
  clearSavedChanges: () => void;
  reset: () => void;
}

export const useZipStore = create<ZipStore>((set, get) => ({
  // Initial state
  zipFile: null,
  fileName: null,
  originalBuffer: null,
  fileTree: [],
  savedChanges: {},
  tabs: [],
  activeTabId: null,
  isLoading: false,
  error: null,

  // Actions
  setZipData: ({ zipFile, fileName, originalBuffer }) => {
    set({ zipFile, fileName, originalBuffer, error: null, savedChanges: {} });
    
    // Build file tree
    const tree = buildFileTree(zipFile);
    set({ fileTree: tree });
  },

  setFileTree: (tree) => set({ fileTree: tree }),

  addTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find(t => t.path === tab.path);
    
    if (existingTab) {
      set({ activeTabId: existingTab.id });
    } else {
      set({ 
        tabs: [...tabs, tab], 
        activeTabId: tab.id 
      });
    }
  },

  removeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter(t => t.id !== tabId);
    
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }
    
    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, content) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, isDirty: true }
        : tab
    );
    set({ tabs: updatedTabs });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Saved changes actions
  setSavedChange: (path, content) => {
    set((state) => ({ savedChanges: { ...state.savedChanges, [path]: content } }));
  },
  removeSavedChange: (path) => {
    const { savedChanges } = get();
    if (path in savedChanges) {
      const { [path]: _, ...rest } = savedChanges;
      set({ savedChanges: rest });
    }
  },
  clearSavedChanges: () => set({ savedChanges: {} }),
  
  reset: () => set({
    zipFile: null,
    fileName: null,
    originalBuffer: null,
    fileTree: [],
    savedChanges: {},
    tabs: [],
    activeTabId: null,
    isLoading: false,
    error: null
  })
}));

// Helper function to build file tree from JSZip
function buildFileTree(zip: JSZip): FileNode[] {
  const tree: FileNode[] = [];
  const pathMap = new Map<string, FileNode>();

  // First pass: create all nodes
  Object.keys(zip.files).forEach(path => {
    const file = zip.files[path];
    const segments = path.split('/').filter(s => s.length > 0);
    
    let currentPath = '';
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
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          isExpanded: false
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

// Helper function to determine file language
export function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const fullName = fileName.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'es6': 'javascript',
    'es': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'vue': 'javascript',
    'svelte': 'javascript',
    
    // Python
    'py': 'python',
    'pyi': 'python',
    'pyw': 'python',
    'pyx': 'python',
    'pxd': 'python',
    'pxi': 'python',
    
    // Java & JVM Languages
    'java': 'java',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'scala': 'scala',
    'groovy': 'groovy',
    'gradle': 'groovy',
    'clj': 'clojure',
    'cljs': 'clojure',
    'cljc': 'clojure',
    
    // C/C++
    'c': 'c',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'c++': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'hxx': 'cpp',
    'hh': 'cpp',
    'h++': 'cpp',
    
    // C#/.NET
    'cs': 'csharp',
    'csx': 'csharp',
    'cake': 'csharp',
    'vb': 'vb',
    'fs': 'fsharp',
    'fsx': 'fsharp',
    'fsi': 'fsharp',
    
    // Web Technologies
    'html': 'html',
    'htm': 'html',
    'xhtml': 'html',
    'shtml': 'html',
    'jsp': 'html',
    'asp': 'html',
    'aspx': 'html',
    'erb': 'html',
    'ejs': 'html',
    'hbs': 'handlebars',
    'handlebars': 'handlebars',
    'mustache': 'handlebars',
    'twig': 'twig',
    
    // CSS and Preprocessors
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'styl': 'stylus',
    'stylus': 'stylus',
    
    // PHP
    'php': 'php',
    'php3': 'php',
    'php4': 'php',
    'php5': 'php',
    'php7': 'php',
    'php8': 'php',
    'phtml': 'php',
    'phps': 'php',
    
    // Ruby
    'rb': 'ruby',
    'rbw': 'ruby',
    'rake': 'ruby',
    'thor': 'ruby',
    'jbuilder': 'ruby',
    
    // Go
    'go': 'go',
    'mod': 'go',
    'sum': 'plaintext',
    
    // Rust
    'rs': 'rust',
    'rlib': 'rust',
    
    // Swift & Objective-C
    'swift': 'swift',
    'm': 'objective-c',
    'mm': 'objective-c',
    
    // Other Popular Languages
    'dart': 'dart',
    'r': 'r',
    'rmd': 'r',
    'matlab': 'matlab',
    'pl': 'perl',
    'pm': 'perl',
    't': 'perl',
    'lua': 'lua',
    'tcl': 'tcl',
    'tk': 'tcl',
    'pascal': 'pascal',
    'pp': 'pascal',
    'dpr': 'pascal',
    'lpr': 'pascal',
    
    // Shell Scripts
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ksh': 'shell',
    'csh': 'shell',
    'tcsh': 'shell',
    'ps1': 'powershell',
    'psm1': 'powershell',
    'psd1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',
    
    // Data & Config Files
    'json': 'json',
    'json5': 'json',
    'jsonc': 'json',
    'xml': 'xml',
    'xsl': 'xml',
    'xslt': 'xml',
    'xsd': 'xml',
    'dtd': 'xml',
    'rss': 'xml',
    'atom': 'xml',
    'plist': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'config': 'ini',
    'properties': 'properties',
    'env': 'plaintext',
    'environ': 'plaintext',
    
    // Documentation
    'md': 'markdown',
    'markdown': 'markdown',
    'mdown': 'markdown',
    'mkd': 'markdown',
    'rst': 'restructuredtext',
    'rest': 'restructuredtext',
    'tex': 'latex',
    'latex': 'latex',
    'ltx': 'latex',
    'sty': 'latex',
    'cls': 'latex',
    'txt': 'plaintext',
    'text': 'plaintext',
    'log': 'plaintext',
    'out': 'plaintext',
    'readme': 'plaintext',
    'changelog': 'plaintext',
    'authors': 'plaintext',
    'contributors': 'plaintext',
    'copying': 'plaintext',
    'license': 'plaintext',
    'install': 'plaintext',
    'news': 'plaintext',
    'todo': 'plaintext',
    
    // SQL
    'sql': 'sql',
    'mysql': 'sql',
    'pgsql': 'sql',
    'plsql': 'sql',
    'psql': 'sql',
    
    // Docker/DevOps
    'dockerfile': 'dockerfile',
    'docker': 'dockerfile',
    'dockerignore': 'plaintext',
    'containerfile': 'dockerfile',
    'k8s': 'yaml',
    'kustomization': 'yaml',
    
    // Version Control
    'gitignore': 'plaintext',
    'gitattributes': 'plaintext',
    'gitmodules': 'plaintext',
    'gitkeep': 'plaintext',
    'hgignore': 'plaintext',
    'bzrignore': 'plaintext',
    
    // Editor/IDE Config
    'editorconfig': 'ini',
    'eslintrc': 'json',
    'tslintrc': 'json',
    'prettierrc': 'json',
    'stylelintrc': 'json',
    'babelrc': 'json',
    'browserslistrc': 'plaintext',
    'nvmrc': 'plaintext',
    'yarnrc': 'plaintext',
    'npmrc': 'plaintext',
    
    // Package Managers & Build Tools
    'tsconfig': 'json',
    'jsconfig': 'json',
    'package': 'json',
    'composer': 'json',
    'cargo': 'toml',
    'gemfile': 'ruby',
    'podfile': 'ruby',
    'cartfile': 'plaintext',
    'brewfile': 'ruby',
    'pipfile': 'toml',
    'poetry': 'toml',
    'requirements': 'plaintext',
    'setup': 'python',
    'makefile': 'makefile',
    'cmake': 'cmake',
    'cmakelists': 'cmake',
    'build': 'groovy',
    'ant': 'xml',
    'maven': 'xml',
    'pom': 'xml',
    'sbt': 'scala',
    
    // Web & Mobile Development
    'lock': 'json',
    'manifest': 'json',
    'webmanifest': 'json',
    'appcache': 'plaintext',
    'htaccess': 'plaintext',
    'htpasswd': 'plaintext',
    'robots': 'plaintext',
    'sitemap': 'xml',
    
    // Graphics & Design (text-based)
    'svg': 'xml',
    'eps': 'postscript',
    'ps': 'postscript',
    
    // Others
    'asm': 'asm',
    's': 'asm',
    'nasm': 'asm',
    'masm': 'asm',
    'vim': 'vim',
    'vimrc': 'vim',
    'tmux': 'plaintext',
    'zshrc': 'shell',
    'bashrc': 'shell',
    'profile': 'shell',
    'aliases': 'shell',
    'functions': 'shell'
  };
  
  // Check by filename first (without extension)
  const nameWithoutExt = fullName.replace(/\.[^.]*$/, '');
  if (languageMap[nameWithoutExt]) {
    return languageMap[nameWithoutExt];
  }
  
  // Check by extension
  return languageMap[ext] || 'plaintext';
}

// Helper function to check if file is binary
export function isBinaryFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const fullName = fileName.toLowerCase();
  
  // Image files (excluding SVG which can be edited as text)
  const binaryImageExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'tiff', 'tif',
    'avif', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw', 'dng'
  ];
  
  // Audio/Video files
  const mediaExtensions = [
    'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'm4a',
    'aac', 'ogg', 'flac', 'wma', 'm4v', '3gp', 'mpg', 'mpeg', 'ogv'
  ];
  
  // Archive files
  const archiveExtensions = [
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lzma', 'cab', 'msi',
    'deb', 'rpm', 'dmg', 'iso', 'img'
  ];
  
  // Document files (binary format)
  const binaryDocumentExtensions = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
    'pages', 'numbers', 'key'
  ];
  
  // Executable and compiled files
  const executableExtensions = [
    'exe', 'dll', 'so', 'dylib', 'app', 'deb', 'rpm', 'msi', 'pkg',
    'bin', 'run', 'command', 'com', 'scr', 'class', 'jar', 'war', 'ear',
    'pyc', 'pyo', 'o', 'obj', 'lib', 'a'
  ];
  
  // Font files
  const fontExtensions = [
    'ttf', 'otf', 'woff', 'woff2', 'eot', 'fon', 'fnt'
  ];
  
  // Database files
  const databaseExtensions = [
    'db', 'sqlite', 'sqlite3', 'mdb', 'accdb', 'dbf'
  ];
  
  // Design files
  const designExtensions = [
    'psd', 'ai', 'sketch', 'fig', 'xd', 'swf', 'fla'
  ];
  
  const strictlyBinaryExtensions = [
    ...binaryImageExtensions,
    ...mediaExtensions,
    ...archiveExtensions,
    ...binaryDocumentExtensions,
    ...executableExtensions,
    ...fontExtensions,
    ...databaseExtensions,
    ...designExtensions
  ];
  
  // Check by extension - only strictly binary files
  if (strictlyBinaryExtensions.includes(ext)) {
    return true;
  }
  
  // Special case: files that might be confused as binary but are actually text
  const textFilenames = [
    'readme', 'license', 'changelog', 'authors', 'contributors', 'copying',
    'install', 'news', 'todo', 'makefile', 'dockerfile', 'vagrantfile',
    'gemfile', 'rakefile', 'procfile', 'gruntfile', 'gulpfile', 'cmakelists'
  ];
  
  if (textFilenames.includes(fullName.replace(/\.[^.]*$/, ''))) {
    return false;
  }
  
  // Files without extensions or with config-like extensions are likely text
  if (!ext || ext.length > 5) {
    return false;
  }
  
  // Default to text if we're not sure
  return false;
}

// Helper function to check if file is image
export function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  // SVG is excluded because it's XML and can be edited as text
  const imageExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 
    'tiff', 'tif', 'avif', 'heic', 'heif'
  ];
  return imageExtensions.includes(ext);
}

// Helper function to check if file is editable text
export function isEditableFile(fileName: string): boolean {
  // If it's not binary, it's likely editable
  if (!isBinaryFile(fileName)) {
    return true;
  }
  
  // SVG is technically XML, so it can be edited as text
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'svg') {
    return true;
  }
  
  return false;
}

// Helper function to get file type category
export function getFileCategory(fileName: string): 'text' | 'image' | 'binary' {
  if (isImageFile(fileName)) {
    return 'image';
  }
  
  if (isBinaryFile(fileName)) {
    return 'binary';
  }
  
  return 'text';
}

// Helper function to determine if file content should be loaded as text
export function shouldLoadAsText(fileName: string): boolean {
  const category = getFileCategory(fileName);
  
  // Load text files and SVG files as text
  if (category === 'text') {
    return true;
  }
  
  // SVG can be edited as text even though it's an image
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'svg') {
    return true;
  }
  
  return false;
}
