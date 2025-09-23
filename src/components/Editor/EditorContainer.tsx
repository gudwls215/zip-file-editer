import React, { useEffect } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useZipStore } from "../../store/zipStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { LazyMonacoEditorWrapper } from "./LazyMonacoEditor";
import { EditorTabs } from "./EditorTabs";
import styled from "styled-components";

// 스타일드 컴포넌트 - VS Code 스타일링
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e; /* VS Code 다크 테마 배경 */
`;

const EditorArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden; /* Monaco Editor가 자체 스크롤 관리 */
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999999;
  font-size: 14px;
  text-align: center;
`;

/**
 * EditorContainer - 에디터 영역 통합 컨테이너
 *
 * 역할:
 * - 탭 바와 Monaco 에디터 영역 통합 관리
 * - 전역 키보드 단축키 처리 (Ctrl+S 등)
 * - 빈 상태 UI 표시 (파일이 열려있지 않을 때)
 * - 지연 로딩된 Monaco 에디터 래핑
 *
 * 기술적 특징:
 * - 컨테이너-프레젠터 패턴: 로직과 UI 분리
 * - 조건부 렌더링: 활성 탭 유무에 따른 UI 전환
 * - 키보드 단축키 통합: 전역 이벤트 처리
 *
 * 성능:
 * - LazyMonacoEditor로 Monaco 에디터 지연 로딩
 * - 빈 상태일 때 불필요한 에디터 인스턴스 생성 방지
 */
export const EditorContainer: React.FC = () => {
  const { getActiveTab, hasUnsavedChanges } = useEditorStore();
  const { saveFile } = useZipStore();

  const activeTab = getActiveTab();

  // 전역 키보드 단축키 처리
  useKeyboardShortcuts({
    onSave: () => {
      if (activeTab && activeTab.isDirty) {
        saveFile(activeTab.path, activeTab.content);
      }
    },
  });

  // 저장되지 않은 변경사항이 있을 때 페이지 나가기 전 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <Container>
      <EditorTabs />
      <EditorArea>
        {activeTab ? (
          <LazyMonacoEditorWrapper />
        ) : (
          <EmptyState>
            <div>
              <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                파일이 선택되지 않음
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                트리에서 파일을 선택하여 편집을 시작하세요
              </div>
            </div>
          </EmptyState>
        )}
      </EditorArea>
    </Container>
  );
};
