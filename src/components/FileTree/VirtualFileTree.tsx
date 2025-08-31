import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import addFileIcon from "../../assets/add_file.svg";
import addFolderIcon from "../../assets/add_folder.svg";
import deleteIcon from "../../assets/delete.svg";

interface VirtualTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  level: number;
  isExpanded?: boolean;
  parentPath?: string;
}

interface VirtualFileTreeProps {
  files: any[];
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
  onAddFile: (parentPath: string, defaultName?: string) => void;
  onAddFolder: (parentPath: string, defaultName?: string) => void;
  onDelete: (path: string, isFolder: boolean) => void;
  height: number;
  itemHeight?: number;
  searchQuery?: string;
}

// 플랫 트리 구조로 변환하는 함수
const flattenTree = (
  files: any[],
  expandedFolders: Set<string>,
  searchQuery?: string
): VirtualTreeNode[] => {
  const result: VirtualTreeNode[] = [];

  const processNode = (node: any, level: number = 0) => {
    // 검색 필터링
    if (searchQuery) {
      const matchesSearch = node.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const hasMatchingChildren = node.children?.some(
        (child: any) =>
          child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          child.children?.length > 0
      );

      if (!matchesSearch && !hasMatchingChildren) {
        return;
      }
    }

    const virtualNode: VirtualTreeNode = {
      id: node.id,
      name: node.name,
      path: node.path,
      type: node.type,
      level,
      isExpanded: expandedFolders.has(node.path),
      parentPath: node.parentPath,
    };

    result.push(virtualNode);

    // 폴더가 확장되어 있고 자식이 있으면 재귀적으로 처리
    if (
      node.type === "folder" &&
      expandedFolders.has(node.path) &&
      node.children
    ) {
      node.children.forEach((child: any) => processNode(child, level + 1));
    }
  };

  files.forEach((file) => processNode(file));
  return result;
};

// 개별 트리 아이템 컴포넌트
const TreeItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  items: VirtualTreeNode[];
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
  onAddFile: (parentPath: string, defaultName?: string) => void;
  onAddFolder: (parentPath: string, defaultName?: string) => void;
  onDelete: (path: string, isFolder: boolean) => void;
}> = ({
  index,
  style,
  items,
  onFileClick,
  onFolderToggle,
  onAddFile,
  onAddFolder,
  onDelete,
}) => {
  const item = items[index];
  const isFolder = item.type === "folder";

  const handleClick = useCallback(() => {
    if (isFolder) {
      onFolderToggle(item.path);
    } else {
      onFileClick(item.path);
    }
  }, [isFolder, item.path, onFileClick, onFolderToggle]);

  const handleAddFile = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddFile(item.path);
    },
    [item.path, onAddFile]
  );

  const handleAddFolder = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddFolder(item.path);
    },
    [item.path, onAddFolder]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(item.path, isFolder);
    },
    [item.path, isFolder, onDelete]
  );

  const paddingLeft = item.level * 16 + 8;

  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        paddingLeft,
        paddingRight: 8,
        cursor: "pointer",
        fontSize: "12px",
        color: "#cccccc",
        transition: "background-color 0.15s ease",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#2a2d2e";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* 폴더/파일 아이콘 */}
      <span style={{ marginRight: 6, fontSize: 10 }}>
        {isFolder ? (item.isExpanded ? "📂" : "📁") : "📄"}
      </span>

      {/* 파일/폴더 이름 */}
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </span>

      {/* 액션 버튼들 */}
      {isFolder ? (
        <div style={{ display: "flex", gap: 4, opacity: 0.7 }}>
          <button
            onClick={handleAddFile}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
            title="Add File"
          >
            <img src={addFileIcon} alt="add_file" width={16} height={16} />
          </button>
          <button
            onClick={handleAddFolder}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
            title="Add Folder"
          >
            <img src={addFolderIcon} alt="add_folder" width={16} height={16} />
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
            title="Delete Folder"
          >
            <img src={deleteIcon} alt="delete_folder" width={16} height={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 4, opacity: 0.7 }}>
          <button
            onClick={handleDelete}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
            title="Delete File"
          >
            <img src={deleteIcon} alt="delete_file" width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export const VirtualFileTree: React.FC<VirtualFileTreeProps> = ({
  files,
  onFileClick,
  onFolderToggle,
  onAddFile,
  onAddFolder,
  onDelete,
  height,
  itemHeight = 24,
  searchQuery,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const listRef = useRef<any>(null);

  // 폴더 토글 핸들러
  const handleFolderToggle = useCallback(
    (path: string) => {
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(path)) {
          newSet.delete(path);
        } else {
          newSet.add(path);
        }
        return newSet;
      });
      onFolderToggle(path);
    },
    [onFolderToggle]
  );

  // 플랫 리스트 생성
  const flatItems = useMemo(() => {
    console.time("Flatten Tree");
    const result = flattenTree(files, expandedFolders, searchQuery);
    console.timeEnd("Flatten Tree");
    console.log(
      `Virtual Tree: ${result.length} visible items from ${files.length} total files`
    );
    return result;
  }, [files, expandedFolders, searchQuery]);

  // 검색어 변경시 맨 위로 스크롤
  useEffect(() => {
    if (searchQuery && listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [searchQuery]);

  if (flatItems.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#999999",
          fontSize: "12px",
        }}
      >
        {searchQuery ? `No files matching "${searchQuery}"` : "No files found"}
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%" }}>
      <div
        style={{
          height: height,
          overflow: "auto",
          width: "100%",
        }}
      >
        {flatItems.map((item, index) => (
          <TreeItem
            key={`${item.path}-${index}`}
            index={index}
            style={{
              height: itemHeight,
              display: "flex",
              alignItems: "center",
            }}
            items={flatItems}
            onFileClick={onFileClick}
            onFolderToggle={handleFolderToggle}
            onAddFile={onAddFile}
            onAddFolder={onAddFolder}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
