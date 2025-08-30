import React, { useCallback } from "react";
import addFileIcon from "../../assets/add_file.svg";
import addFolderIcon from "../../assets/add_folder.svg";
import deleteIcon from "../../assets/delete.svg";
import {
  useZipStore,
  getFileLanguage,
  isBinaryFile,
  isImageFile,
} from "../../store/zipStore";
import { useEditorStore } from "../../store/editorStore";

interface FileNodeProps {
  node: {
    id: string;
    name: string;
    path: string;
    type: "file" | "folder";
    children?: any[];
    isExpanded?: boolean;
  };
  level: number;
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
  onAddFile: (parentPath: string, defaultName?: string) => void;
  onAddFolder: (parentPath: string, defaultName?: string) => void;
  onDelete: (path: string, isFolder: boolean) => void;
}

const FileNode: React.FC<FileNodeProps> = ({
  node,
  level,
  onFileClick,
  onFolderToggle,
  onAddFile,
  onAddFolder,
  onDelete,
}) => {
  const isFolder = node.type === "folder";

  const handleClick = useCallback(() => {
    if (isFolder) {
      onFolderToggle(node.path);
    } else {
      onFileClick(node.path);
    }
  }, [isFolder, node.path, onFileClick, onFolderToggle]);

  const getIcon = () => {
    if (isFolder) {
      return node.isExpanded ? "📂" : "📁";
    }

    if (isImageFile(node.name)) return "🖼️";
    if (isBinaryFile(node.name)) return "📄";

    const ext = node.name.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "html":
        return "🌐";
      case "css":
        return "🎨";
      case "scss":
      case "sass":
      case "less":
        return "🎨";
      default:
        return "📄";
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          paddingLeft: `${8 + level * 16}px`,
          cursor: "pointer",
          fontSize: "12px",
          color: "#cccccc",
          userSelect: "none",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2d2e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span style={{ marginRight: "6px", fontSize: "10px" }}>
          {getIcon()}
        </span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </span>
        {/* Actions */}
        {isFolder ? (
          <span
            style={{ display: "flex", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="New file"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => {
                const name = window.prompt("Enter new file name");
                if (!name) return;
                onAddFile(node.path, name);
              }}
            >
              <img src={addFileIcon} alt="add_file" width={16} height={16} />
            </button>
            <button
              title="New folder"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => {
                const name = window.prompt("Enter new folder name");
                if (!name) return;
                onAddFolder(node.path, name);
              }}
            >
              <img
                src={addFolderIcon}
                alt="add_folder"
                width={16}
                height={16}
              />
            </button>
            <button
              title="Delete folder"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => onDelete(node.path, true)}
            >
              <img
                src={deleteIcon}
                alt="delete_folder"
                width={16}
                height={16}
              />
            </button>
          </span>
        ) : (
          <span onClick={(e) => e.stopPropagation()}>
            <button
              title="Delete file"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => onDelete(node.path, false)}
            >
              <img src={deleteIcon} alt="delete_file" width={16} height={16} />
            </button>
          </span>
        )}
      </div>

      {isFolder && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNode
              key={child.id}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              onFolderToggle={onFolderToggle}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const { fileTree, setFileTree, zipFile, addFolder, addFile, deletePath } =
    useZipStore();
  const { addTab, tabs, removeTab } = useEditorStore();

  const handleAddFolder = useCallback(
    (parentPath: string | null, name?: string) => {
      const folderName = (
        name ??
        window.prompt("Enter new folder name") ??
        ""
      ).trim();
      if (!folderName) return;
      addFolder(
        parentPath && parentPath.length > 0 ? parentPath : null,
        folderName
      );
    },
    [addFolder]
  );

  const handleAddFile = useCallback(
    (parentPath: string | null, name?: string) => {
      const fileName = (
        name ??
        window.prompt("Enter new file name") ??
        ""
      ).trim();
      if (!fileName) return;
      addFile(
        parentPath && parentPath.length > 0 ? parentPath : null,
        fileName,
        ""
      );
    },
    [addFile]
  );

  const handleDelete = useCallback(
    (path: string, isFolder: boolean) => {
      const confirmed = window.confirm(
        `Delete ${isFolder ? "folder and its contents" : "file"}: ${path}?`
      );
      if (!confirmed) return;
      // Clean up open tabs for this path
      const prefix = isFolder ? `${path}/` : path;
      tabs
        .filter(
          (t) => t.path === path || (isFolder && t.path.startsWith(prefix))
        )
        .forEach((t) => removeTab(t.id));
      deletePath(path);
    },
    [tabs, removeTab, deletePath]
  );

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

  if (fileTree.length === 0) {
    return (
      <div
        style={{
          padding: "20px 12px",
          textAlign: "center",
          color: "#999999",
          fontSize: "12px",
          fontStyle: "italic",
        }}
      >
        Upload a ZIP file to see the file tree
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "8px 0",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Top-level actions */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 8px 8px",
          alignItems: "center",
        }}
      ></div>
      {fileTree.map((node) => (
        <FileNode
          key={node.id}
          node={node}
          level={0}
          onFileClick={handleFileClick}
          onFolderToggle={handleFolderToggle}
          onAddFile={handleAddFile}
          onAddFolder={handleAddFolder}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
