import type { FileItem, FileTreeNode, FileNode } from "../types";

/**
 * Tree Utilities - 파일 트리 구조 처리 유틸리티
 *
 * 목적:
 * - 평면적인 파일 목록을 계층적 트리 구조로 변환
 * - 가상화된 트리 렌더링을 위한 데이터 전처리
 * - 트리 탐색, 검색, 필터링 기능 제공
 *
 * 핵심 기능:
 * - 파일 트리 구조 생성
 * - 트리 평면화 (가상 스크롤링용)
 * - 노드 검색 및 경로 추적
 * - 트리 상태 관리 (확장/축소)
 */

/**
 * 평면적인 파일 목록을 계층적 트리 구조로 변환
 *
 * 알고리즘:
 * 1. 파일들을 디렉토리 우선, 이름순으로 정렬
 * 2. 경로를 분석하여 중간 디렉토리 자동 생성
 * 3. Map을 사용한 빠른 노드 조회 및 중복 방지
 * 4. 부모-자식 관계 설정 및 depth 계산
 *
 * 성능 최적화:
 * - O(n) 시간복잡도로 트리 구성
 * - Map 자료구조로 O(1) 노드 조회
 * - 중복 노드 생성 방지
 *
 * 특징:
 * - 중간 디렉토리 자동 생성 (경로 연속성 보장)
 * - 확장 상태 초기화 (collapsed 상태)
 * - depth 정보로 들여쓰기 렌더링 지원
 */
export const buildFileTree = (files: FileItem[]): FileTreeNode[] => {
  const rootNodes: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // 디렉토리 우선, 이름순 정렬로 일관된 트리 구조 보장
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "directory" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });

  sortedFiles.forEach((file) => {
    const pathParts = file.path.split("/").filter(Boolean);
    let currentPath = "";
    let depth = 0;

    // 경로의 각 세그먼트를 순회하며 트리 구조 구성
    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!nodeMap.has(currentPath)) {
        const isLeaf = index === pathParts.length - 1;
        const node: FileTreeNode = {
          id: file.id,
          name: part,
          path: currentPath,
          type: isLeaf ? file.type : "directory",
          size: isLeaf ? file.size : undefined,
          content: isLeaf ? file.content : undefined,
          children: [] as FileTreeNode[],
          depth,
          expanded: false, // 초기에는 모든 노드 축소
          parentId: depth === 0 ? undefined : pathParts.slice(0, -1).join("/"),
        };

        nodeMap.set(currentPath, node);

        // 루트 레벨 노드 추가
        if (depth === 0) {
          rootNodes.push(node);
        } else {
          // 부모 노드에 자식으로 추가
          const parentPath = pathParts.slice(0, -1).join("/");
          const parent = nodeMap.get(parentPath);
          if (parent) {
            parent.children!.push(node);
          }
        }
      }
      depth++;
    });
  });

  return rootNodes;
};

/**
 * 계층적 트리를 평면 목록으로 변환 (가상 스크롤링용)
 *
 * 목적:
 * - React Window/Virtualized 등 가상 스크롤링 라이브러리 연동
 * - 확장된 노드만 포함하여 실제 렌더링할 항목만 추출
 * - 트리 구조를 유지하면서 선형 리스트로 변환
 *
 * 알고리즘:
 * - DFS(깊이 우선 탐색) 방식으로 순회
 * - expanded 상태인 노드의 자식만 포함
 * - depth 정보로 들여쓰기 표현
 *
 * 성능 이점:
 * - 대용량 파일 트리의 효율적 렌더링
 * - 화면에 보이는 항목만 DOM에 생성
 * - 스크롤 성능 최적화
 */
export const flattenTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
  const result: FileTreeNode[] = [];

  const traverse = (node: FileTreeNode) => {
    result.push(node);
    // 확장된 디렉토리의 자식들만 포함
    if (node.expanded && node.children) {
      (node.children as FileTreeNode[]).forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return result;
};

/**
 * ID로 특정 노드 검색
 *
 * 검색 방식:
 * - 재귀적 DFS로 전체 트리 순회
 * - 첫 번째 일치하는 노드 반환
 * - 성능 최적화를 위해 조기 종료
 *
 * 활용:
 * - 파일 선택 시 노드 정보 조회
 * - 트리 상태 변경 시 대상 노드 찾기
 * - 경로 기반 네비게이션
 */
export const findNodeById = (
  nodes: FileTreeNode[],
  id: string
): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children as FileTreeNode[], id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 노드 확장/축소 상태 토글
 *
 * 상태 변경:
 * - 대상 노드의 expanded 속성 반전
 * - Immutable 업데이트로 React 최적화
 * - 하위 노드는 영향받지 않음 (개별 제어)
 *
 * 구현 방식:
 * - 재귀적으로 트리 순회
 * - 대상 노드 발견 시 상태 변경
 * - 나머지 노드는 기존 상태 유지
 *
 * React 최적화:
 * - 새로운 객체 생성으로 참조 동등성 보장
 * - 메모이제이션 및 리렌더링 최적화
 */
export const toggleNodeExpansion = (
  nodes: FileTreeNode[],
  id: string
): FileTreeNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return {
        ...node,
        children: toggleNodeExpansion(node.children as FileTreeNode[], id),
      };
    }
    return node;
  });
};

/**
 * 파일 트리 정렬 (디렉토리 우선, 이름순)
 *
 * 정렬 규칙:
 * 1. 디렉토리가 파일보다 우선
 * 2. 같은 타입 내에서는 이름순 정렬
 * 3. 대소문자 구분 없는 정렬
 *
 * 재귀적 정렬:
 * - 각 레벨에서 정렬 수행
 * - 하위 디렉토리도 동일한 규칙 적용
 *
 * 사용자 경험:
 * - 일관된 파일 트리 구조
 * - 디렉토리를 먼저 표시하여 탐색 용이성 향상
 */
export const sortFileTree = (node: FileNode): FileNode => {
  if (node.type === "file" || !node.children) {
    return node;
  }

  // 자식 노드들을 정렬 (디렉토리 우선, 이름순)
  const sortedChildren = [...node.children].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    // 숫자가 포함된 이름도 올바르게 정렬 (numeric: true)
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return {
    ...node,
    children: sortedChildren.map(sortFileTree), // 재귀적으로 하위 노드도 정렬
  };
};

/**
 * 경로로 노드 검색
 *
 * 검색 방식:
 * - 루트부터 경로 기반 탐색
 * - 정확한 경로 매칭
 * - 성능 최적화를 위한 조기 종료
 *
 * 활용:
 * - URL 기반 파일 네비게이션
 * - 북마크된 파일 직접 접근
 * - 브레드크럼 네비게이션
 *
 * 경로 형식:
 * - "src/components/App.tsx" 형태
 * - 슬래시(/) 구분자 사용
 */
export const findNodeByPath = (
  root: FileNode | null,
  path: string
): FileNode | null => {
  if (!root) return null;
  if (root.path === path) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }

  return null;
};

/**
 * 트리의 총 파일 개수 계산
 *
 * 계산 방식:
 * - 재귀적으로 모든 노드 순회
 * - 파일 타입 노드만 카운트
 * - 디렉토리는 제외
 *
 * 용도:
 * - 진행률 표시 (처리된 파일 / 전체 파일)
 * - 통계 정보 제공
 * - 성능 예측 (대용량 파일 처리)
 *
 * 성능:
 * - O(n) 시간복잡도 (모든 노드 방문)
 * - 메모이제이션으로 최적화 가능
 */
export const countFiles = (node: FileNode): number => {
  if (node.type === "file") return 1;
  if (!node.children) return 0;
  return node.children.reduce((acc, child) => acc + countFiles(child), 0);
};
