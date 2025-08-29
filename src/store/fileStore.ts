import { useState, useCallback } from 'react';
import type { FileItem, FileTreeNode, FileNode } from '../types';

interface FileStore {
  files: FileItem[];
  fileTree: FileTreeNode[];
  selectedFileId: string | null;
  isLoading: boolean;
  error: string | null;
  rootNode: FileNode | null;
  flatMap: Map<string, FileNode>;
}

const initialState: FileStore = {
  files: [],
  fileTree: [],
  selectedFileId: null,
  isLoading: false,
  error: null,
  rootNode: null,
  flatMap: new Map(),
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
      files: prev.files.filter((f: FileItem) => f.id !== fileId),
      selectedFileId: prev.selectedFileId === fileId ? null : prev.selectedFileId
    }));
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<FileItem>) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map((f: FileItem) => 
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

  const setRootNode = useCallback((node: FileNode) => {
    setState(prev => {
      const newFlatMap = new Map<string, FileNode>();
      const buildFlatMap = (n: FileNode) => {
        newFlatMap.set(n.path, n);
        if (n.children) {
          n.children.forEach(buildFlatMap);
        }
      };
      buildFlatMap(node);
      
      return { ...prev, rootNode: node, flatMap: newFlatMap };
    });
  }, []);

  const updateFileContent = useCallback((path: string, content: string | ArrayBuffer) => {
    setState(prev => {
      const newFlatMap = new Map(prev.flatMap);
      const node = newFlatMap.get(path);
      if (node) {
        const updatedNode = { ...node, content, modified: true };
        newFlatMap.set(path, updatedNode);
      }
      return { ...prev, flatMap: newFlatMap };
    });
  }, []);

  const getNodeByPath = useCallback((path: string): FileNode | undefined => {
    return state.flatMap.get(path);
  }, [state.flatMap]);

  const markAsModified = useCallback((path: string, modified: boolean) => {
    setState(prev => {
      const newFlatMap = new Map(prev.flatMap);
      const node = newFlatMap.get(path);
      if (node) {
        const updatedNode = { ...node, modified };
        newFlatMap.set(path, updatedNode);
      }
      return { ...prev, flatMap: newFlatMap };
    });
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
    setRootNode,
    updateFileContent,
    getNodeByPath,
    markAsModified,
  };
};
