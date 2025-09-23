import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { VirtualFileTree } from "./VirtualFileTree";
import { FileTree } from "./FileTree";
import {
  useZipStore,
  getFileLanguage,
  isBinaryFile,
  isImageFile,
} from "../../store/zipStore";
import { useEditorStore } from "../../store/editorStore";

interface OptimizedFileTreeProps {
  maxItemsBeforeVirtual?: number; // 가상화 활성화 임계값
}

/**
 * OptimizedFileTree - 적응형 성능 최적화 파일 트리
 *
 * 핵심 최적화 전략:
 * - 임계값 기반 렌더링: 1000개 미만은 일반 트리, 이상은 가상 스크롤링
 * - 검색 최적화: 실시간 필터링으로 대용량 파일 처리
 * - 메모이제이션: useMemo로 비용이 큰 계산 결과 캐싱
 *
 * 기술적 특징:
 * - 하이브리드 렌더링: 파일 수에 따른 동적 컴포넌트 선택
 * - 검색 기능: 실시간 파일명 필터링
 * - 파일 타입 감지: 확장자 기반 언어 및 바이너리 파일 판별
 *
 * 성능 지표:
 * - < 1000개: 일반 DOM 렌더링으로 빠른 응답
 * - ≥ 1000개: 가상 스크롤링으로 메모리 효율성
 * - 검색: O(n) 필터링이지만 사용자 입력 시에만 실행
 */
export const OptimizedFileTree: React.FC<OptimizedFileTreeProps> = ({
  maxItemsBeforeVirtual = 1000, // 임계값: 1000개 이상일 때 가상화 활성화
}) => {
  // 검색 상태 관리
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 스토어 상태 및 액션
  const { fileTree, addFile, addFolder, zipFile, setFileTree } = useZipStore();
  const { addTab } = useEditorStore();

  // 파일 개수 계산 - 재귀적으로 모든 파일 카운트
  const getTotalFileCount = useCallback(() => {
    const countFiles = (nodes: any[]): number => {
      return nodes.reduce((count, node) => {
        if (node.type === "file") {
          return count + 1; // 파일인 경우 카운트 증가
        } else if (node.children) {
          return count + countFiles(node.children); // 폴더인 경우 재귀 호출
        }
        return count;
      }, 0);
    };
    return countFiles(fileTree);
  }, [fileTree]);

  // 📈 총 파일 개수 - useMemo로 불필요한 재계산 방지
  const totalFileCount = useMemo(
    () => getTotalFileCount(),
    [getTotalFileCount]
  );

  // Virtual scrolling 사용 여부 결정
  const shouldUseVirtualScrolling = totalFileCount > maxItemsBeforeVirtual;

  // 디버깅용 로그
  console.log(
    `🔍 OptimizedFileTree: ${totalFileCount} files, Virtual Mode: ${shouldUseVirtualScrolling}`
  );

  // 검색 핸들러
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  // 파일 클릭 핸들러
  const handleFileClick = useCallback(
    async (path: string) => {
      console.log("File clicked:", path);
      console.log("EditorStore addTab function:", typeof addTab);

      if (!zipFile) {
        console.log("No zip file loaded");
        return;
      }

      try {
        const file = zipFile.files[path];
        if (!file || file.dir) {
          console.log("Invalid file or directory:", path);
          return;
        }

        const fileName = path.split("/").pop() || path;
        console.log("Processing file:", fileName);

        // 파일 카테고리 결정
        const isImage = isImageFile(fileName);
        const isBinary = isBinaryFile(fileName);

        if (isBinary && !isImage) {
          console.log("Binary file detected (non-image)");
          // 이미지가 아닌 바이너리 파일의 경우 메시지 표시
          addTab({
            name: fileName,
            path: path,
            content: `// 바이너리 파일: ${fileName}\n// 이 파일은 텍스트로 편집할 수 없습니다.\n// 파일 형식: ${
              fileName.split(".").pop()?.toUpperCase() || "알 수 없음"
            }`,
            language: "plaintext",
          });
        } else if (isImage) {
          console.log("Image file detected");
          // 이미지의 경우 이미지를 표시하는 특별한 탭 생성
          const blob = await file.async("blob");
          const imageUrl = URL.createObjectURL(blob);

          addTab({
            name: fileName,
            path: path,
            content: imageUrl, // 이미지 URL을 내용으로 저장
            language: "image",
          });
        } else {
          console.log("Text file detected, loading content...");
          // 텍스트 파일(SVG 포함)의 경우 내용 로드
          try {
            const content = await file.async("string");
            const language = getFileLanguage(fileName);

            console.log(
              "File content loaded, length:",
              content.length,
              "language:",
              language
            );

            addTab({
              name: fileName,
              path: path,
              content: content,
              language: language,
            });

            console.log("Tab added successfully");
          } catch (textError) {
            console.log(
              "Failed to load as text, treating as binary:",
              textError
            );
            // 텍스트 로딩 실패 시 바이너리로 처리
            addTab({
              name: fileName,
              path: path,
              content: `// 파일 로딩 오류: ${fileName}\n// 이 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.`,
              language: "plaintext",
            });
          }
        }
      } catch (error) {
        console.error("Error loading file:", error);
        // 에디터에 오류 표시
        const fileName = path.split("/").pop() || path;
        addTab({
          name: fileName,
          path: path,
          content: `// 파일 로딩 오류: ${fileName}\n// ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          language: "plaintext",
        });
      }
    },
    [zipFile, addTab]
  );

  // 폴더 토글 핸들러
  const handleFolderToggle = useCallback(
    (path: string) => {
      const toggleNode = (nodes: any[]): any[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };

      const updatedTree = toggleNode(fileTree);
      setFileTree(updatedTree);
    },
    [fileTree, setFileTree]
  );

  // 파일 추가 핸들러
  const handleAddFile = useCallback(
    (parentPath: string, defaultName?: string) => {
      const fileName = defaultName || prompt("Enter file name:");
      if (fileName && fileName.trim()) {
        const fullPath = parentPath
          ? `${parentPath}/${fileName.trim()}`
          : fileName.trim();
        addFile(fullPath, "");
      }
    },
    [addFile]
  );

  // 폴더 추가 핸들러
  const handleAddFolder = useCallback(
    (parentPath: string, defaultName?: string) => {
      const folderName = defaultName || prompt("Enter folder name:");
      if (folderName && folderName.trim()) {
        const fullPath = parentPath
          ? `${parentPath}/${folderName.trim()}`
          : folderName.trim();
        addFolder(fullPath, "");
      }
    },
    [addFolder]
  );

  // 삭제 핸들러
  const handleDelete = useCallback((path: string, isFolder: boolean) => {
    const confirmMsg = `정말로 ${
      isFolder ? "폴더" : "파일"
    } "${path}"을(를) 삭제하시겠습니까?`;
    if (window.confirm(confirmMsg)) {
      // TODO: 실제 삭제 구현
      console.log("Delete:", path, isFolder ? "folder" : "file");
    }
  }, []);

  // 검색 필터링된 파일 트리
  const filteredFileTree = useMemo(() => {
    console.time("FilterTree"); // 성능 측정 시작

    if (!searchQuery.trim()) {
      console.timeEnd("FilterTree");
      return fileTree;
    }

    const filterTree = (nodes: any[]): any[] => {
      return nodes.reduce((acc: any[], node) => {
        const matchesSearch = node.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const filteredChildren = node.children ? filterTree(node.children) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }

        return acc;
      }, []);
    };

    const result = filterTree(fileTree);
    console.timeEnd("FilterTree"); // 성능 측정 종료
    console.log(
      `🔍 Filter result: ${result.length} items from ${fileTree.length} total`
    );
    return result;
  }, [fileTree, searchQuery]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F로 검색 포커스
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }

      // ESC로 검색 취소
      if (e.key === "Escape" && isSearchFocused) {
        setSearchQuery("");
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 상단 정보 및 검색 */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid #464647",
          backgroundColor: "#2d2d30",
        }}
      >
        {/* 파일 카운트 정보 */}
        <div
          style={{
            fontSize: "11px",
            color: "#a0a0a0",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            📁 {totalFileCount.toLocaleString()} files
            {shouldUseVirtualScrolling && (
              <span style={{ color: "#007acc", marginLeft: "8px" }}>
                Virtual Mode
              </span>
            )}
          </span>
          {searchQuery && (
            <span style={{ color: "#f48771" }}>
              {filteredFileTree.length} matches
            </span>
          )}
        </div>

        {/* 검색 입력 */}
        <div style={{ position: "relative" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files... (Ctrl+F)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              width: "100%",
              padding: "6px 30px 6px 8px",
              backgroundColor: "#1e1e1e",
              border: `1px solid ${isSearchFocused ? "#007acc" : "#464647"}`,
              borderRadius: "4px",
              color: "#cccccc",
              fontSize: "12px",
              outline: "none",
            }}
          />

          {/* 검색 아이콘/클리어 버튼 */}
          <div
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: searchQuery ? "pointer" : "default",
              color: searchQuery ? "#007acc" : "#666666",
              fontSize: "12px",
            }}
          >
            {searchQuery ? (
              <span onClick={handleSearchClear}>✕</span>
            ) : (
              <span>🔍</span>
            )}
          </div>
        </div>
      </div>

      {/* 파일 트리 영역 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {totalFileCount === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#999999",
              fontSize: "12px",
            }}
          >
            No files loaded. Upload a ZIP file to get started.
          </div>
        ) : shouldUseVirtualScrolling ? (
          <VirtualFileTree
            files={filteredFileTree}
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
            onAddFile={handleAddFile}
            onAddFolder={handleAddFolder}
            onDelete={handleDelete}
            height={window.innerHeight - 200} // 대략적인 높이
            searchQuery={searchQuery}
          />
        ) : (
          // 기존 FileTree 컴포넌트 사용 (작은 파일 개수일 때)
          <div style={{ height: "100%", overflow: "hidden" }}>
            <FileTree />
          </div>
        )}
      </div>
    </div>
  );
};
