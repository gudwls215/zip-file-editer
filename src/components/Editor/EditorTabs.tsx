import React, { memo, useCallback, useMemo } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useZipStore } from "../../store/zipStore";
import styled from "styled-components";

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

const TabsArea = styled.div`
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
`;

const ActionsArea = styled.div`
  display: flex;
  align-items: center;
  padding: 0 8px;
  background-color: #2d2d30;
  border-left: 1px solid #464647;
`;

const SaveButton = styled.button<{ $hasUnsaved: boolean }>`
  padding: 4px 8px;
  background: ${(props) => (props.$hasUnsaved ? "#007acc" : "transparent")};
  border: 1px solid ${(props) => (props.$hasUnsaved ? "#007acc" : "#464647")};
  color: ${(props) => (props.$hasUnsaved ? "#ffffff" : "#cccccc")};
  font-size: 11px;
  border-radius: 3px;
  cursor: ${(props) => (props.$hasUnsaved ? "pointer" : "default")};
  transition: all 0.15s ease;
  opacity: ${(props) => (props.$hasUnsaved ? 1 : 0.5)};

  &:hover {
    background: ${(props) => (props.$hasUnsaved ? "#005a9e" : "transparent")};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const Tab = styled.div<{ $isActive: boolean; $isDirty: boolean }>`
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  padding: 0 12px;
  background-color: ${(props) => (props.$isActive ? "#1e1e1e" : "#2d2d30")};
  border-right: 1px solid #464647;
  cursor: pointer;
  font-size: 12px;
  color: ${(props) => (props.$isActive ? "#ffffff" : "#cccccc")};
  transition: background-color 0.15s ease;
  position: relative;

  &:hover {
    background-color: ${(props) => (props.$isActive ? "#1e1e1e" : "#3e3e40")};
  }

  ${(props) =>
    props.$isDirty &&
    `
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
  margin-left: ${(props) => (props.$isDirty ? "12px" : "0")};
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

const TabItem = memo<TabItemProps>(
  ({ tab, isActive, onTabClick, onTabClose }) => {
    const handleClick = useCallback(() => {
      onTabClick(tab.id);
    }, [tab.id, onTabClick]);

    const handleClose = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onTabClose(tab.id);
      },
      [tab.id, onTabClose]
    );

    const handleMiddleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1) {
          // Middle mouse button
          e.preventDefault();
          onTabClose(tab.id);
        }
      },
      [tab.id, onTabClose]
    );

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
  }
);

TabItem.displayName = "TabItem";

export const EditorTabs: React.FC = memo(() => {
  const { tabs, activeTabId, setActiveTab, removeTab, getActiveTab } =
    useEditorStore();
  const { saveFile } = useZipStore();

  console.log(
    "EditorTabs render - tabs:",
    tabs.length,
    "activeTabId:",
    activeTabId
  );

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
    },
    [setActiveTab]
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      useEditorStore.getState().addRecentlyClosedTab(useEditorStore.getState().getTabById(tabId)!);
      removeTab(tabId);
    },
    [removeTab]
  );

  const handleSave = useCallback(() => {
    const activeTab = getActiveTab();
    if (activeTab && activeTab.isDirty) {
      saveFile(activeTab.path, activeTab.content);
    }
  }, [getActiveTab, saveFile]);

  const activeTab = getActiveTab();
  const hasUnsavedChanges = activeTab?.isDirty || false;

  const tabItems = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        name: tab.name,
        isDirty: tab.isDirty,
      })),
    [tabs]
  );

  if (tabs.length === 0) {
    return (
      <TabsContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "12px",
            fontSize: "12px",
            color: "#999999",
            fontStyle: "italic",
          }}
        >
          No files open
        </div>
      </TabsContainer>
    );
  }

  return (
    <TabsContainer>
      <TabsArea>
        {tabItems.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
          />
        ))}
      </TabsArea>
      <ActionsArea>
        <SaveButton
          $hasUnsaved={hasUnsavedChanges}
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          title={
            hasUnsavedChanges
              ? "Save current file (Ctrl+S)"
              : "No changes to save"
          }
        >
          Save
        </SaveButton>
      </ActionsArea>
    </TabsContainer>
  );
});

EditorTabs.displayName = "EditorTabs";
