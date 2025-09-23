import React, { memo, useCallback, useMemo, useState } from "react";
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

const Tab = styled.div<{ 
  $isActive: boolean; 
  $isDirty: boolean; 
  $isDraggedOver?: boolean;
  $isDragging?: boolean;
}>`
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  padding: 0 12px;
  background-color: ${(props) => (props.$isActive ? "#1e1e1e" : "#2d2d30")};
  border-right: 1px solid #464647;
  cursor: ${(props) => (props.$isDragging ? "grabbing" : "pointer")};
  font-size: 12px;
  color: ${(props) => (props.$isActive ? "#ffffff" : "#cccccc")};
  transition: all 0.15s ease;
  position: relative;
  opacity: ${(props) => (props.$isDragging ? 0.5 : 1)};

  &:hover {
    background-color: ${(props) => (props.$isActive ? "#1e1e1e" : "#3e3e40")};
  }

  /* 드래그 오버 시 시각적 피드백 */
  ${(props) =>
    props.$isDraggedOver &&
    `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: #007acc;
      z-index: 10;
    }
  `}

  ${(props) =>
    props.$isDirty &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #007acc;
      transform: translateY(-50%);
      z-index: 5;
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
  onTabReorder: (draggedTabId: string, targetTabId: string) => void;
}

const TabItem = memo<TabItemProps>(
  ({ tab, isActive, onTabClick, onTabClose, onTabReorder }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggedOver, setIsDraggedOver] = useState(false);

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

    //  드래그 시작 이벤트 핸들러
    const handleDragStart = useCallback(
      (e: React.DragEvent) => {
        /**
         * dataTransfer: HTML5 드래그 앤 드롭 API의 핵심 객체
         * 드래그되는 데이터를 저장하고 전달하는 역할
         */
        
        // 1️⃣ 드래그할 데이터 설정 (탭의 고유 ID를 저장)
        // setData(format, data): 드래그 시 전달할 데이터를 설정
        // 'text/plain': MIME 타입, 일반 텍스트로 데이터 저장
        // tab.id: 어떤 탭이 드래그되는지 식별하기 위한 고유값
        e.dataTransfer.setData('text/plain', tab.id);
        
        // 2️⃣ 드래그 효과 설정
        // effectAllowed: 허용되는 드래그 효과 타입
        // 'move': 이동(잘라내기) 효과, 복사가 아닌 위치 변경을 의미
        e.dataTransfer.effectAllowed = 'move';
        
        // 3️⃣ 컴포넌트 상태 업데이트 (UI 피드백용)
        setIsDragging(true);
        
        // 4️⃣ 커스텀 드래그 이미지 설정 (선택사항)
        // cloneNode(true): 현재 탭 요소를 깊은 복사
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.opacity = '0.8'; // 반투명 효과
        // setDragImage(element, x, y): 드래그 시 보여질 이미지와 마우스 포인터 위치
        e.dataTransfer.setDragImage(dragImage, 60, 17); // 탭 중앙에 포인터 위치
        
        console.log(`🔄 드래그 시작: ${tab.name} (ID: ${tab.id})`);
      },
      [tab.id, tab.name]
    );

    //  드래그 끝
    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
      console.log(`✅ 드래그 끝: ${tab.name}`);
    }, [tab.name]);

    //  드래그 오버 이벤트 핸들러
    const handleDragOver = useCallback((e: React.DragEvent) => {
      /**
       * preventDefault(): 필수! 기본 동작을 막아야 드롭이 허용됨
       * 브라우저 기본값은 드롭을 금지하므로, 이를 해제해야 함
       */
      e.preventDefault();
      
      /**
       * dropEffect: 드롭 시 수행할 작업의 시각적 표시
       * 'move': 이동 커서 표시 (화살표 + 상자 아이콘)
       * 사용자에게 "여기에 드롭하면 이동됩니다"라는 시각적 피드백 제공
       */
      e.dataTransfer.dropEffect = 'move';
    }, []);

    //  드래그 엔터 이벤트 핸들러
    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      
      /**
       * getData(): 드래그 시작 시 setData()로 저장한 데이터 조회
       * 'text/plain': 저장할 때와 동일한 MIME 타입으로 데이터 가져오기
       * 
       * ⚠️ 주의: dragenter에서는 getData()가 빈 문자열을 반환할 수 있음
       * 보안상의 이유로 drop 이벤트에서만 실제 데이터에 접근 가능
       * 하지만 Chrome/Firefox에서는 대부분 정상 작동함
       */
      const draggedTabId = e.dataTransfer.getData('text/plain');
      
      // 자기 자신이 아닌 다른 탭이 드래그되어 올 때만 하이라이트
      if (draggedTabId !== tab.id) {
        setIsDraggedOver(true); // 파란색 세로선 표시
      }
    }, [tab.id]);

    //  드래그 리브 이벤트 핸들러  
    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      
      /**
       * relatedTarget: 마우스가 이동한 다음 요소
       * contains(): 현재 요소가 지정된 요소를 포함하는지 확인
       * 
       * 이 검사가 필요한 이유:
       * - 탭 내부의 자식 요소(TabName, CloseButton) 간 이동 시에도 dragLeave 발생
       * - 실제로 탭을 완전히 벗어날 때만 하이라이트를 제거해야 함
       * - 자식 요소 간 이동은 무시하고, 외부로 나갈 때만 반응
       */
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDraggedOver(false); // 파란색 세로선 제거
      }
    }, []);

    //  드롭 이벤트 핸들러 (가장 중요!)
    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault(); // 브라우저 기본 동작 방지
        
        /**
         * 여기서 실제 데이터 교환이 일어남!
         * drop 이벤트에서는 모든 브라우저에서 getData()가 정상 작동함
         * 
         * 드래그 앤 드롭 과정:
         * 1. dragstart에서 setData()로 탭 ID 저장
         * 2. 사용자가 마우스로 탭을 끌고 다님 
         * 3. drop에서 getData()로 저장된 탭 ID 조회
         * 4. 두 탭의 위치를 실제로 바꿈
         */
        const draggedTabId = e.dataTransfer.getData('text/plain');
        
        // 자기 자신에게 드롭하는 경우는 무시 (의미 없는 동작)
        if (draggedTabId !== tab.id) {
          // 실제 탭 순서 변경 로직 실행
          // draggedTabId: 드래그된 탭의 ID
          // tab.id: 드롭된 위치(타겟)의 탭 ID  
          onTabReorder(draggedTabId, tab.id);
          console.log(`🎯 드롭 완료: ${draggedTabId} → ${tab.id} 위치로 이동`);
        }
        
        // UI 상태 정리
        setIsDraggedOver(false);
      },
      [tab.id, onTabReorder]
    );

    return (
      <Tab
        $isActive={isActive}
        $isDirty={tab.isDirty}
        $isDragging={isDragging}
        $isDraggedOver={isDraggedOver}
        onClick={handleClick}
        onMouseDown={handleMiddleClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
  const { tabs, activeTabId, setActiveTab, removeTab, getActiveTab, reorderTabs } =
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
      removeTab(tabId);
    },
    [removeTab]
  );

  const handleTabReorder = useCallback(
    (draggedTabId: string, targetTabId: string) => {
      reorderTabs(draggedTabId, targetTabId);
    },
    [reorderTabs]
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
            onTabReorder={handleTabReorder}
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
