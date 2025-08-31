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
  maxItemsBeforeVirtual?: number; // 이 개수 이상이면 Virtual Tree 사용
}

export const OptimizedFileTree: React.FC<OptimizedFileTreeProps> = ({
  maxItemsBeforeVirtual = 10, // 테스트를 위해 10으로 낮춤 (원래 1000)
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { fileTree, addFile, addFolder, zipFile, setFileTree } = useZipStore();
  const { addTab } = useEditorStore();

  // 총 파일 개수 계산 (임시 구현)
  const getTotalFileCount = useCallback(() => {
    const countFiles = (nodes: any[]): number => {
      return nodes.reduce((count, node) => {
        if (node.type === "file") {
          return count + 1;
        } else if (node.children) {
          return count + countFiles(node.children);
        }
        return count;
      }, 0);
    };
    return countFiles(fileTree);
  }, [fileTree]);

  // 총 파일 개수 계산
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

        // Determine file category
        const isImage = isImageFile(fileName);
        const isBinary = isBinaryFile(fileName);

        if (isBinary && !isImage) {
          console.log("Binary file detected (non-image)");
          // For non-image binary files, show a message
          addTab({
            name: fileName,
            path: path,
            content: `// Binary file: ${fileName}\n// This file cannot be edited as text.\n// File type: ${
              fileName.split(".").pop()?.toUpperCase() || "Unknown"
            }`,
            language: "plaintext",
          });
        } else if (isImage) {
          console.log("Image file detected");
          // For images, create a special tab that shows the image
          const blob = await file.async("blob");
          const imageUrl = URL.createObjectURL(blob);

          addTab({
            name: fileName,
            path: path,
            content: imageUrl, // Store image URL as content
            language: "image",
          });
        } else {
          console.log("Text file detected, loading content...");
          // For text files (including SVG), load the content
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
            // If text loading fails, treat as binary
            addTab({
              name: fileName,
              path: path,
              content: `// Error loading file: ${fileName}\n// This file might be corrupted or in an unsupported format.`,
              language: "plaintext",
            });
          }
        }
      } catch (error) {
        console.error("Error loading file:", error);
        // Show error in editor
        const fileName = path.split("/").pop() || path;
        addTab({
          name: fileName,
          path: path,
          content: `// Error loading file: ${fileName}\n// ${
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
    const confirmMsg = `Are you sure you want to delete ${
      isFolder ? "folder" : "file"
    } "${path}"?`;
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
