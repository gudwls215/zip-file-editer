import React from 'react';
import { TreeNode } from './TreeNode';
import { useFileStore } from '../../store/fileStore';
import { useEditorStore } from '../../store/editorStore';
import { toggleNodeExpansion } from '../../utils/treeUtils';

export const FileTree: React.FC = () => {
  const fileStore = useFileStore();
  const editorStore = useEditorStore();

  const handleNodeSelect = (nodeId: string) => {
    const file = fileStore.files.find(f => f.id === nodeId);
    if (file && file.type === 'file') {
      fileStore.setSelectedFileId(nodeId);
      editorStore.openFile(nodeId, file.content || '');
    }
  };

  const handleNodeToggle = (nodeId: string) => {
    const updatedTree = toggleNodeExpansion(fileStore.fileTree, nodeId);
    fileStore.setFileTree(updatedTree);
  };

  if (fileStore.files.length === 0) {
    return (
      <div style={{
        padding: '16px',
        color: '#8c8c8c',
        fontSize: '13px',
        textAlign: 'center',
      }}>
        No files loaded
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#252526',
      overflow: 'auto',
    }}>
      <div style={{
        padding: '8px 0',
        borderBottom: '1px solid #464647',
        color: '#cccccc',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        paddingLeft: '8px',
      }}>
        Explorer
      </div>
      <div>
        {fileStore.fileTree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onSelect={handleNodeSelect}
            onToggle={handleNodeToggle}
            isSelected={fileStore.selectedFileId === node.id}
          />
        ))}
      </div>
    </div>
  );
};
