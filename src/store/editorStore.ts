import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  viewState?: any;
  lastModified?: Date;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  theme: string;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export interface EditorActions {
  // Tab management
  addTab: (tab: Omit<EditorTab, 'id' | 'isDirty'>) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabSaved: (tabId: string) => void;
  setTabViewState: (tabId: string, viewState: any | null) => void;
  closeAllTabs: () => void;
  closeDirtyTabs: () => EditorTab[];
  
  // Editor settings
  setTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;
  
  // Utility
  getActiveTab: () => EditorTab | undefined;
  hasUnsavedChanges: () => boolean;
  getDirtyTabs: () => EditorTab[];
  
  // Legacy compatibility
  openFile: (fileId: string, content: string) => void;
  openTab: (tabData: Omit<EditorTab, 'id' | 'isDirty'>) => void;
  closeFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileSaved: (fileId: string) => void;
  clearTabs: () => void;
  closeAllFiles: () => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      tabs: [],
      activeTabId: null,
      theme: 'vs-dark',
      fontSize: 14,
      wordWrap: true,
      minimap: false,

      // Actions
      addTab: (tabData) => {
        const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('EditorStore: Adding tab', { id, tabData });
        
        set((state) => {
          // Check if tab with same path already exists
          const existingTab = state.tabs.find(tab => tab.path === tabData.path);
          if (existingTab) {
            console.log('EditorStore: Tab already exists, activating:', existingTab.id);
            state.activeTabId = existingTab.id;
            return;
          }

          const newTab: EditorTab = {
            ...tabData,
            id,
            isDirty: false,
            lastModified: new Date()
          };

          console.log('EditorStore: Creating new tab:', newTab);
          state.tabs.push(newTab);
          state.activeTabId = id;
        });
        
        return id;
      },

      removeTab: (tabId) => {
        set((state) => {
          const index = state.tabs.findIndex(tab => tab.id === tabId);
          if (index === -1) return;

          state.tabs.splice(index, 1);

          if (state.activeTabId === tabId) {
            if (state.tabs.length > 0) {
              const newIndex = Math.min(index, state.tabs.length - 1);
              state.activeTabId = state.tabs[newIndex]?.id || null;
            } else {
              state.activeTabId = null;
            }
          }
        });
      },

      setActiveTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            state.activeTabId = tabId;
          }
        });
      },

      updateTabContent: (tabId, content) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            if (tab.content !== content) {
              tab.content = content;
              tab.isDirty = true;
              tab.lastModified = new Date();
            }
          }
        });
      },

      markTabSaved: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.isDirty = false;
          }
        });
      },

      setTabViewState: (tabId, viewState) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.viewState = viewState || undefined;
          }
        });
      },

      closeAllTabs: () => {
        set((state) => {
          state.tabs = [];
          state.activeTabId = null;
        });
      },

      closeDirtyTabs: () => {
        const dirtyTabs = get().tabs.filter(tab => tab.isDirty);
        set((state) => {
          state.tabs = state.tabs.filter(tab => !tab.isDirty);
          if (state.activeTabId && dirtyTabs.some(tab => tab.id === state.activeTabId)) {
            state.activeTabId = state.tabs[0]?.id || null;
          }
        });
        return dirtyTabs;
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
      },

      setFontSize: (size) => {
        set((state) => {
          state.fontSize = Math.max(8, Math.min(32, size));
        });
      },

      toggleWordWrap: () => {
        set((state) => {
          state.wordWrap = !state.wordWrap;
        });
      },

      toggleMinimap: () => {
        set((state) => {
          state.minimap = !state.minimap;
        });
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find(tab => tab.id === activeTabId);
      },

      hasUnsavedChanges: () => {
        return get().tabs.some(tab => tab.isDirty);
      },

      getDirtyTabs: () => {
        return get().tabs.filter(tab => tab.isDirty);
      },

      // Legacy compatibility methods
      openFile: (fileId, content) => {
        const name = fileId.split('/').pop() || fileId;
        get().addTab({
          name,
          path: fileId,
          content,
          language: 'javascript'
        });
      },

      openTab: (tabData) => {
        get().addTab(tabData);
      },

      closeFile: (fileId) => {
        get().removeTab(fileId);
      },

      closeTab: (tabId) => {
        get().removeTab(tabId);
      },

      setActiveFile: (fileId) => {
        get().setActiveTab(fileId);
      },

      updateFileContent: (fileId, content) => {
        get().updateTabContent(fileId, content);
      },

      markFileSaved: (fileId) => {
        get().markTabSaved(fileId);
      },

      clearTabs: () => {
        get().closeAllTabs();
      },

      closeAllFiles: () => {
        get().closeAllTabs();
      }
    }))
  )
);

// Selectors for performance optimization
export const useActiveTab = () => useEditorStore(state => state.getActiveTab());
export const useHasUnsavedChanges = () => useEditorStore(state => state.hasUnsavedChanges());
export const useDirtyTabs = () => useEditorStore(state => state.getDirtyTabs());
