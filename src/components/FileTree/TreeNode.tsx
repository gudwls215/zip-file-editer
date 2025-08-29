import React from 'react';
import { FileIcon } from './FileIcon';
import type { FileTreeNode } from '../../types';

interface TreeNodeProps {
  node: FileTreeNode;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
  isSelected: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onSelect,
  onToggle,
  isSelected,
}) => {
  const handleClick = () => {
    if (node.type === 'directory') {
      onToggle(node.id);
    } else {
      onSelect(node.id);
    }
  };

  const indentSize = node.depth * 16;

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${8 + indentSize}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#094771' : 'transparent',
          color: '#cccccc',
          fontSize: '13px',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#2a2d2e';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {node.type === 'directory' && (
          <span style={{ marginRight: '4px', fontSize: '12px' }}>
            {node.expanded ? '▼' : '▶'}
          </span>
        )}
        <FileIcon
          fileName={node.name}
          isDirectory={node.type === 'directory'}
          isExpanded={node.expanded}
        />
        <span style={{ marginLeft: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>
      {node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child as FileTreeNode}
              onSelect={onSelect}
              onToggle={onToggle}
              isSelected={false} // Children selection would be handled by parent
            />
          ))}
        </div>
      )}
    </div>
  );
};
