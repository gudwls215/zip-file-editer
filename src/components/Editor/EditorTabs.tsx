import React from 'react';
import type { EditorTab } from '../../types';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}) => {
  if (tabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#2d2d30',
      borderBottom: '1px solid #464647',
      overflow: 'auto'
    }}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: activeTabId === tab.id ? '#1e1e1e' : 'transparent',
            borderRight: '1px solid #464647',
            cursor: 'pointer',
            minWidth: '120px',
            color: '#cccccc',
            fontSize: '13px',
          }}
        >
          <span style={{ 
            marginRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {tab.name}
            {tab.isModified && ' •'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
