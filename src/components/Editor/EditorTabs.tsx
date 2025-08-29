import React, { useCallback } from 'react';
import { useZipStore } from '../../store/zipStore';

export const EditorTabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useZipStore();

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  }, [removeTab]);

  if (tabs.length === 0) {
    return (
      <div style={{
        height: '35px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        fontSize: '12px',
        color: '#999999',
        fontStyle: 'italic'
      }}>
        Tabs
      </div>
    );
  }

  return (
    <div style={{
      height: '35px',
      display: 'flex',
      alignItems: 'stretch',
      overflowX: 'auto',
      borderBottom: '1px solid #464647'
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        
        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: '120px',
              maxWidth: '200px',
              padding: '0 12px',
              backgroundColor: isActive ? '#1e1e1e' : '#2d2d30',
              borderRight: '1px solid #464647',
              cursor: 'pointer',
              fontSize: '12px',
              color: isActive ? '#ffffff' : '#cccccc',
              position: 'relative',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#3e3e40';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#2d2d30';
              }
            }}
          >
            {/* File Icon */}
            <span style={{ 
              marginRight: '6px', 
              fontSize: '10px',
              opacity: 0.8 
            }}>
              {getFileIcon(tab.name, tab.language)}
            </span>
            
            {/* File Name */}
            <span style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {tab.name}
            </span>
            
            {/* Dirty Indicator */}
            {tab.isDirty && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#007acc',
                marginLeft: '4px',
                marginRight: '4px'
              }} />
            )}
            
            {/* Close Button */}
            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              style={{
                width: '16px',
                height: '16px',
                border: 'none',
                background: 'none',
                color: '#999999',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                borderRadius: '2px',
                transition: 'background-color 0.15s ease',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#464647';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#999999';
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

function getFileIcon(fileName: string, language: string): string {
  if (language === 'image') return '◈';
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'scss': case 'sass': case 'less': return '🎨';
      default: return '📄';
  }
}
