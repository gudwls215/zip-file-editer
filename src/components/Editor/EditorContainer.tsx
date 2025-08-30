import React, { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { MonacoEditor } from './MonacoEditor';
import { EditorTabs } from './EditorTabs';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
`;

const EditorArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
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

export const EditorContainer: React.FC = () => {
  const {
    getActiveTab,
    hasUnsavedChanges
  } = useEditorStore();

  const activeTab = getActiveTab();

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <Container>
      <EditorTabs />
      <EditorArea>
        {activeTab ? (
          <MonacoEditor />
        ) : (
          <EmptyState>
            <div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                No file selected
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Select a file from the tree to start editing
              </div>
            </div>
          </EmptyState>
        )}
      </EditorArea>
    </Container>
  );
};
