import { useState, useCallback } from 'react';
import type { EditorState, EditorTab } from '../types';

interface ExtendedEditorState extends EditorState {
  tabs: EditorTab[];
  monacoInstance: any | null;
}

const initialState: ExtendedEditorState = {
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  unsavedChanges: {},
  tabs: [],
  monacoInstance: null,
};

export const useEditorStore = () => {
  const [state, setState] = useState<ExtendedEditorState>(initialState);

  const openFile = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      openFiles: prev.openFiles.includes(fileId) ? prev.openFiles : [...prev.openFiles, fileId],
      fileContents: { ...prev.fileContents, [fileId]: content },
      activeFileId: fileId,
    }));
  }, []);

  const openTab = useCallback((tabData: Omit<EditorTab, 'id' | 'active'>) => {
    setState(prev => {
      const existingTab = prev.tabs.find((t: EditorTab) => t.path === tabData.path);
      
      if (existingTab) {
        return {
          ...prev,
          activeFileId: existingTab.id,
          tabs: prev.tabs.map((t: EditorTab) => ({ ...t, active: t.id === existingTab.id }))
        };
      } else {
        const newTab: EditorTab = {
          ...tabData,
          id: `${Date.now()}-${Math.random()}`,
          active: true
        };
        return {
          ...prev,
          tabs: [...prev.tabs.map((t: EditorTab) => ({ ...t, active: false })), newTab],
          activeFileId: newTab.id,
        };
      }
    });
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      openFiles: prev.openFiles.filter((id: string) => id !== fileId),
      activeFileId: prev.activeFileId === fileId ? 
        (prev.openFiles.length > 1 ? prev.openFiles[0] : null) : prev.activeFileId,
    }));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      const index = prev.tabs.findIndex((t: EditorTab) => t.id === tabId);
      if (index === -1) return prev;
      
      const newTabs = [...prev.tabs];
      newTabs.splice(index, 1);
      
      let newActiveId = prev.activeFileId;
      if (prev.activeFileId === tabId && newTabs.length > 0) {
        const newActiveTab = newTabs[Math.min(index, newTabs.length - 1)];
        newActiveId = newActiveTab.id;
        newActiveTab.active = true;
      } else if (newTabs.length === 0) {
        newActiveId = null;
      }
      
      return { ...prev, tabs: newTabs, activeFileId: newActiveId };
    });
  }, []);

  const setActiveFile = useCallback((fileId: string) => {
    setState(prev => ({ ...prev, activeFileId: fileId }));
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map((t: EditorTab) => ({ ...t, active: t.id === tabId })),
      activeFileId: tabId,
    }));
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      fileContents: { ...prev.fileContents, [fileId]: content },
      unsavedChanges: { ...prev.unsavedChanges, [fileId]: true },
    }));
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map((t: EditorTab) => 
        t.id === tabId ? { ...t, content, modified: true } : t
      )
    }));
  }, []);

  const markFileSaved = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      unsavedChanges: { ...prev.unsavedChanges, [fileId]: false },
    }));
  }, []);

  const setMonacoInstance = useCallback((instance: any) => {
    setState(prev => ({ ...prev, monacoInstance: instance }));
  }, []);

  const getActiveTab = useCallback((): EditorTab | undefined => {
    return state.tabs.find((t: EditorTab) => t.id === state.activeFileId);
  }, [state.tabs, state.activeFileId]);

  const closeAllFiles = useCallback(() => {
    setState(initialState);
  }, []);

  const clearTabs = useCallback(() => {
    setState(prev => ({ ...prev, tabs: [], activeFileId: null }));
  }, []);

  return {
    ...state,
    openFile,
    openTab,
    closeFile,
    closeTab,
    setActiveFile,
    setActiveTab,
    updateFileContent,
    updateTabContent,
    markFileSaved,
    setMonacoInstance,
    getActiveTab,
    closeAllFiles,
    clearTabs,
  };
};
