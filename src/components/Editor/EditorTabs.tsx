import React, { memo, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import styled from 'styled-components';

const TabsContainer = styled.div`
  display: flex;
  height: 35px;
  background-color: #2d2d30;
  border-bottom: 1px solid #464647;
  overflow-x: auto;
  overflow-y: hidden;
  
  &::-webkit-scrollbar {
    height: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: #2d2d30;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #464647;
    border-radius: 2px;
  }
`;

const Tab = styled.div<{ $isActive: boolean; $isDirty: boolean }>`
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  padding: 0 12px;
  background-color: ${props => props.$isActive ? '#1e1e1e' : '#2d2d30'};
  border-right: 1px solid #464647;
  cursor: pointer;
  font-size: 12px;
  color: ${props => props.$isActive ? '#ffffff' : '#cccccc'};
  transition: background-color 0.15s ease;
  position: relative;
  
  &:hover {
    background-color: ${props => props.$isActive ? '#1e1e1e' : '#3e3e40'};
  }
  
  ${props => props.$isDirty && `
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #007acc;
      transform: translateY(-50%);
    }
  `}
`;

const TabName = styled.span<{ $isDirty: boolean }>`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: ${props => props.$isDirty ? '12px' : '0'};
`;

const CloseButton = styled.button`
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 2px;
  transition: all 0.15s ease;
  margin-left: 4px;
  
  &:hover {
    background-color: #464647;
    color: #ffffff;
  }
`;

interface TabItemProps {
  tab: {
    id: string;
    name: string;
    isDirty: boolean;
  };
  isActive: boolean;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

const TabItem = memo<TabItemProps>(({ tab, isActive, onTabClick, onTabClose }) => {
  const handleClick = useCallback(() => {
    onTabClick(tab.id);
  }, [tab.id, onTabClick]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose(tab.id);
  }, [tab.id, onTabClose]);

  const handleMiddleClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      onTabClose(tab.id);
    }
  }, [tab.id, onTabClose]);

  return (
    <Tab
      $isActive={isActive}
      $isDirty={tab.isDirty}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      title={tab.name}
    >
      <TabName $isDirty={tab.isDirty}>{tab.name}</TabName>
      <CloseButton onClick={handleClose} title="Close tab">
        ×
      </CloseButton>
    </Tab>
  );
});

TabItem.displayName = 'TabItem';

export const EditorTabs: React.FC = memo(() => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useEditorStore();

  console.log('EditorTabs render - tabs:', tabs.length, 'activeTabId:', activeTabId);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleTabClose = useCallback((tabId: string) => {
    removeTab(tabId);
  }, [removeTab]);

  const tabItems = useMemo(() => 
    tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      isDirty: tab.isDirty
    })),
    [tabs]
  );

  if (tabs.length === 0) {
    return (
      <TabsContainer>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          fontSize: '12px',
          color: '#999999',
          fontStyle: 'italic'
        }}>
          No files open
        </div>
      </TabsContainer>
    );
  }

  return (
    <TabsContainer>
      {tabItems.map(tab => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
        />
      ))}
    </TabsContainer>
  );
});

EditorTabs.displayName = 'EditorTabs';
