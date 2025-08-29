import { useState, useCallback } from 'react';
import type { EditorState } from '../types';

const initialState: EditorState = {
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  unsavedChanges: {},
};

export const useEditorStore = () => {
  const [state, setState] = useState<EditorState>(initialState);

  const openFile = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      openFiles: prev.openFiles.includes(fileId) ? prev.openFiles : [...prev.openFiles, fileId],
      fileContents: { ...prev.fileContents, [fileId]: content },
      activeFileId: fileId,
    }));
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      openFiles: prev.openFiles.filter(id => id !== fileId),
      activeFileId: prev.activeFileId === fileId ? 
        (prev.openFiles.length > 1 ? prev.openFiles[0] : null) : prev.activeFileId,
    }));
  }, []);

  const setActiveFile = useCallback((fileId: string) => {
    setState(prev => ({ ...prev, activeFileId: fileId }));
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      fileContents: { ...prev.fileContents, [fileId]: content },
      unsavedChanges: { ...prev.unsavedChanges, [fileId]: true },
    }));
  }, []);

  const markFileSaved = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      unsavedChanges: { ...prev.unsavedChanges, [fileId]: false },
    }));
  }, []);

  const closeAllFiles = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    markFileSaved,
    closeAllFiles,
  };
};
