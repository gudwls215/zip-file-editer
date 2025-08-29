import { useState, useCallback } from 'react';
import type { FileItem, FileTreeNode } from '../types';

interface FileStore {
  files: FileItem[];
  fileTree: FileTreeNode[];
  selectedFileId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FileStore = {
  files: [],
  fileTree: [],
  selectedFileId: null,
  isLoading: false,
  error: null,
};

export const useFileStore = () => {
  const [state, setState] = useState<FileStore>(initialState);

  const setFiles = useCallback((files: FileItem[]) => {
    setState(prev => ({ ...prev, files }));
  }, []);

  const addFile = useCallback((file: FileItem) => {
    setState(prev => ({ ...prev, files: [...prev.files, file] }));
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId),
      selectedFileId: prev.selectedFileId === fileId ? null : prev.selectedFileId
    }));
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<FileItem>) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileId ? { ...f, ...updates } : f
      )
    }));
  }, []);

  const setFileTree = useCallback((tree: FileTreeNode[]) => {
    setState(prev => ({ ...prev, fileTree: tree }));
  }, []);

  const setSelectedFileId = useCallback((fileId: string | null) => {
    setState(prev => ({ ...prev, selectedFileId: fileId }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearFiles = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    setFiles,
    addFile,
    removeFile,
    updateFile,
    setFileTree,
    setSelectedFileId,
    setLoading,
    setError,
    clearFiles,
  };
};
