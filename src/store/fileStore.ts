import { useState, useCallback } from "react";
import type { FileItem, FileTreeNode, FileNode } from "../types";

/**
 * FileStore - 파일 시스템 상태 인터페이스
 *
 * 파일 트리와 개별 파일들의 상태를 관리
 * ZIP 파일 내부의 파일 구조를 메모리에서 효율적으로 표현
 */
interface FileStore {
  files: FileItem[]; // 평면적인 파일 목록 (검색용)
  fileTree: FileTreeNode[]; // 계층적 파일 트리 구조 (UI 표시용)
  selectedFileId: string | null; // 현재 선택된 파일 ID
  isLoading: boolean; // 파일 로딩 상태
  error: string | null; // 에러 메시지
  rootNode: FileNode | null; // 루트 디렉토리 노드
  flatMap: Map<string, FileNode>; // 파일 경로를 키로 하는 평면 맵 (O(1) 검색용)
}

/**
 * 초기 상태 정의
 *
 * 모든 상태를 빈 값으로 초기화
 * flatMap은 빠른 파일 검색을 위한 Map 구조
 */
const initialState: FileStore = {
  files: [],
  fileTree: [],
  selectedFileId: null,
  isLoading: false,
  error: null,
  rootNode: null,
  flatMap: new Map(),
};

/**
 * useFileStore - 파일 시스템 상태 관리 훅
 *
 * 특징:
 * - React useState 기반 로컬 상태 관리
 * - useCallback으로 함수 메모이제이션
 * - 불변성 유지 (스프레드 연산자 활용)
 *
 * 사용 목적:
 * - ZipStore와 분리하여 관심사 분리
 * - 파일 시스템 로직만 독립적으로 관리
 * - 재사용 가능한 파일 관리 로직 제공
 */
export const useFileStore = () => {
  const [state, setState] = useState<FileStore>(initialState);

  /**
   * 파일 목록 전체 설정
   *
   * 주로 ZIP 파일 로드 시 전체 파일 목록을 한번에 설정
   */
  const setFiles = useCallback((files: FileItem[]) => {
    setState((prev) => ({ ...prev, files }));
  }, []);

  /**
   * 단일 파일 추가
   *
   * 새로운 파일 생성 시 기존 배열에 추가
   * 불변성 유지를 위해 스프레드 연산자 사용
   */
  const addFile = useCallback((file: FileItem) => {
    setState((prev) => ({ ...prev, files: [...prev.files, file] }));
  }, []);

  /**
   * 파일 제거
   *
   * 처리 과정:
   * 1. 대상 파일을 배열에서 필터링으로 제거
   * 2. 제거된 파일이 현재 선택된 파일이면 선택 해제
   */
  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f: FileItem) => f.id !== fileId),
      // 삭제된 파일이 선택되어 있다면 선택 해제
      selectedFileId:
        prev.selectedFileId === fileId ? null : prev.selectedFileId,
    }));
  }, []);

  /**
   * 파일 정보 부분 업데이트
   *
   * 특정 파일의 속성만 선택적으로 업데이트
   * Partial<FileItem>으로 부분 업데이트 지원
   */
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

  /**
   * 파일 트리 구조 설정
   *
   * 계층적 구조로 변환된 파일 트리를 설정
   * UI 렌더링용 데이터 구조
   */
  const setFileTree = useCallback((tree: FileTreeNode[]) => {
    setState((prev) => ({ ...prev, fileTree: tree }));
  }, []);

  /**
   * 선택된 파일 ID 설정
   *
   * 파일 트리에서 클릭한 파일을 선택 상태로 변경
   */
  const setSelectedFileId = useCallback((fileId: string | null) => {
    setState((prev) => ({ ...prev, selectedFileId: fileId }));
  }, []);

  /**
   * 로딩 상태 설정
   *
   * 파일 시스템 작업 중 로딩 상태 표시
   */
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  /**
   * 에러 상태 설정
   *
   * 파일 시스템 작업 중 발생한 에러 표시
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * 모든 파일 상태 초기화
   *
   * 새로운 ZIP 파일 로드 시 기존 상태 완전 정리
   */
  const clearFiles = useCallback(() => {
    // 모든 파일 상태 초기화
    setState(initialState);
  }, []);

  /**
   * 루트 노드 설정 및 평면 맵 구성
   *
   * 처리 과정:
   * 1. 루트 노드 설정
   * 2. 전체 트리를 순회하여 평면 맵 생성
   * 3. 빠른 파일 검색을 위한 인덱스 구성
   */
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
