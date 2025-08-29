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
  reset: () => void;
}

export const useZipStore = create<ZipStore>((set, get) => ({
  // Initial state
  zipFile: null,
  fileName: null,
  originalBuffer: null,
  fileTree: [],
  tabs: [],
  activeTabId: null,
  isLoading: false,
  error: null,

  // Actions
  setZipData: ({ zipFile, fileName, originalBuffer }) => {
    set({ zipFile, fileName, originalBuffer, error: null });
    
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
  
  reset: () => set({
    zipFile: null,
    fileName: null,
    originalBuffer: null,
    fileTree: [],
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
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'txt': 'plaintext',
    'log': 'plaintext'
  };
  
  return languageMap[ext] || 'plaintext';
}

// Helper function to check if file is binary
export function isBinaryFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'tar', 'gz',
    'exe', 'dll', 'so', 'dylib',
    'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv',
    'ttf', 'otf', 'woff', 'woff2'
  ];
  
  return binaryExtensions.includes(ext);
}

// Helper function to check if file is image
export function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico'];
  return imageExtensions.includes(ext);
}
