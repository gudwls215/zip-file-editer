import React, { useCallback } from 'react';
import { useZipStore, getFileLanguage, isBinaryFile, isImageFile } from '../../store/zipStore';

interface FileNodeProps {
  node: {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: any[];
    isExpanded?: boolean;
  };
  level: number;
  onFileClick: (path: string) => void;
  onFolderToggle: (path: string) => void;
}

const FileNode: React.FC<FileNodeProps> = ({ node, level, onFileClick, onFolderToggle }) => {
  const isFolder = node.type === 'folder';

  const handleClick = useCallback(() => {
    if (isFolder) {
      onFolderToggle(node.path);
    } else {
      onFileClick(node.path);
    }
  }, [isFolder, node.path, onFileClick, onFolderToggle]);

  const getIcon = () => {
    if (isFolder) {
      return node.isExpanded ? '📂' : '📁';
    }
    
    if (isImageFile(node.name)) return '🖼️';
    if (isBinaryFile(node.name)) return '📄';
    
    const ext = node.name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'scss': case 'sass': case 'less': return '🎨';
      default: return '📄';
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${8 + level * 16}px`,
          cursor: 'pointer',
          fontSize: '12px',
          color: '#cccccc',
          userSelect: 'none',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2a2d2e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ marginRight: '6px', fontSize: '10px' }}>
          {getIcon()}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const { fileTree, setFileTree, zipFile, addTab } = useZipStore();

  const handleFolderToggle = useCallback((path: string) => {
    const toggleNode = (nodes: any[]): any[] => {
      return nodes.map(node => {
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
  }, [fileTree, setFileTree]);

  const handleFileClick = useCallback(async (path: string) => {
    console.log('File clicked:', path);
    
    if (!zipFile) {
      console.log('No zip file loaded');
      return;
    }

    try {
      const file = zipFile.files[path];
      if (!file || file.dir) {
        console.log('Invalid file or directory:', path);
        return;
      }

      const fileName = path.split('/').pop() || path;
      console.log('Processing file:', fileName);
      
      // Determine file category
      const isImage = isImageFile(fileName);
      const isBinary = isBinaryFile(fileName);
      
      if (isBinary && !isImage) {
        console.log('Binary file detected (non-image)');
        // For non-image binary files, show a message
        addTab({
          id: path,
          name: fileName,
          path: path,
          content: `// Binary file: ${fileName}\n// This file cannot be edited as text.\n// File type: ${fileName.split('.').pop()?.toUpperCase() || 'Unknown'}`,
          language: 'plaintext',
          isDirty: false
        });
      } else if (isImage) {
        console.log('Image file detected');
        // For images, create a special tab that shows the image
        const blob = await file.async('blob');
        const imageUrl = URL.createObjectURL(blob);
        
        addTab({
          id: path,
          name: fileName,
          path: path,
          content: imageUrl, // Store image URL as content
          language: 'image',
          isDirty: false
        });
      } else {
        console.log('Text file detected, loading content...');
        // For text files (including SVG), load the content
        try {
          const content = await file.async('string');
          const language = getFileLanguage(fileName);
          
          console.log('File content loaded, length:', content.length, 'language:', language);
          
          addTab({
            id: path,
            name: fileName,
            path: path,
            content: content,
            language: language,
            isDirty: false
          });
          
          console.log('Tab added successfully');
        } catch (textError) {
          console.log('Failed to load as text, treating as binary:', textError);
          // If text loading fails, treat as binary
          addTab({
            id: path,
            name: fileName,
            path: path,
            content: `// Error loading file: ${fileName}\n// This file might be corrupted or in an unsupported format.`,
            language: 'plaintext',
            isDirty: false
          });
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      // Show error in editor
      const fileName = path.split('/').pop() || path;
      addTab({
        id: path,
        name: fileName,
        path: path,
        content: `// Error loading file: ${fileName}\n// ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        language: 'plaintext',
        isDirty: false
      });
    }
  }, [zipFile, addTab]);

  if (fileTree.length === 0) {
    return (
      <div style={{
        padding: '20px 12px',
        textAlign: 'center',
        color: '#999999',
        fontSize: '12px',
        fontStyle: 'italic'
      }}>
        Upload a ZIP file to see the file tree
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 0',
      height: '100%',
      overflow: 'auto'
    }}>
      {fileTree.map((node) => (
        <FileNode
          key={node.id}
          node={node}
          level={0}
          onFileClick={handleFileClick}
          onFolderToggle={handleFolderToggle}
        />
      ))}
    </div>
  );
};
