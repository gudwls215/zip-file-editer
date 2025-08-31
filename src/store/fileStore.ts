import { useState, useCallback } from "react";
import type { FileItem, FileTreeNode, FileNode } from "../types";

interface FileStore {
  files: FileItem[]; // 파일 목록
  fileTree: FileTreeNode[]; // 파일 트리 구조
  selectedFileId: string | null; // 선택된 파일 ID
  isLoading: boolean; // 로딩 상태
  error: string | null; // 에러 메시지
  rootNode: FileNode | null; // 루트 노드
  flatMap: Map<string, FileNode>; // 파일 경로를 키로 하는 평면 맵 (빠른 검색용)
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
    setState((prev) => ({ ...prev, files }));
  }, []);

  const addFile = useCallback((file: FileItem) => {
    setState((prev) => ({ ...prev, files: [...prev.files, file] }));
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f: FileItem) => f.id !== fileId),
      // 삭제된 파일이 선택되어 있다면 선택 해제
      selectedFileId:
        prev.selectedFileId === fileId ? null : prev.selectedFileId,
    }));
  }, []);

  const updateFile = useCallback(
    (fileId: string, updates: Partial<FileItem>) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f: FileItem) =>
          f.id === fileId ? { ...f, ...updates } : f
        ),
      }));
    },
    []
  );

  const setFileTree = useCallback((tree: FileTreeNode[]) => {
    setState((prev) => ({ ...prev, fileTree: tree }));
  }, []);

  const setSelectedFileId = useCallback((fileId: string | null) => {
    setState((prev) => ({ ...prev, selectedFileId: fileId }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearFiles = useCallback(() => {
    // 모든 파일 상태 초기화
    setState(initialState);
  }, []);

  const setRootNode = useCallback((node: FileNode) => {
    setState((prev) => {
      const newFlatMap = new Map<string, FileNode>();
      // 노드 트리를 순회하며 평면 맵 구성 (빠른 검색을 위함)
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

  const updateFileContent = useCallback(
    (path: string, content: string | ArrayBuffer) => {
      setState((prev) => {
        const newFlatMap = new Map(prev.flatMap);
        const node = newFlatMap.get(path);
        if (node) {
          // 파일 내용 업데이트 및 수정 상태 표시 (do/undo 관련)
          const updatedNode = { ...node, content, modified: true };
          newFlatMap.set(path, updatedNode);
        }
        return { ...prev, flatMap: newFlatMap };
      });
    },
    []
  );

  const getNodeByPath = useCallback(
    (path: string): FileNode | undefined => {
      // 경로로 노드 찾기 (O(1) 성능)
      return state.flatMap.get(path);
    },
    [state.flatMap]
  );

  const markAsModified = useCallback((path: string, modified: boolean) => {
    setState((prev) => {
      const newFlatMap = new Map(prev.flatMap);
      const node = newFlatMap.get(path);
      if (node) {
        // 파일의 수정 상태 변경 (do/undo 기능과 연관)
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
