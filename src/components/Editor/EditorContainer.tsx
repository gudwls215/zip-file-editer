import React from 'react';
import { MonacoEditor } from './MonacoEditor';
import { EditorTabs } from './EditorTabs';
import { useEditorStore } from '../../store/editorStore';
import { useFileStore } from '../../store/fileStore';
import { getLanguageFromExtension, getFileExtension } from '../../utils/fileUtils';
import type { EditorTab } from '../../types';

export const EditorContainer: React.FC = () => {
  const editorStore = useEditorStore();
  const fileStore = useFileStore();

  const tabs: EditorTab[] = editorStore.openFiles.map(fileId => {
    const file = fileStore.files.find(f => f.id === fileId);
    if (!file) return null;

    return {
      id: file.id,
      name: file.name,
      path: file.path,
      isModified: editorStore.unsavedChanges[fileId] || false,
      language: getLanguageFromExtension(getFileExtension(file.name)),
    };
  }).filter(Boolean) as EditorTab[];

  const activeFile = fileStore.files.find(f => f.id === editorStore.activeFileId);
  const activeContent = editorStore.activeFileId ? 
    editorStore.fileContents[editorStore.activeFileId] || '' : '';

  const handleTabClick = (tabId: string) => {
    editorStore.setActiveFile(tabId);
  };

  const handleTabClose = (tabId: string) => {
    editorStore.closeFile(tabId);
  };

  const handleEditorChange = (value: string) => {
    if (editorStore.activeFileId) {
      editorStore.updateFileContent(editorStore.activeFileId, value);
    }
  };

  const handleSave = () => {
    if (editorStore.activeFileId) {
      editorStore.markFileSaved(editorStore.activeFileId);
      // Here you would typically save to the file system or update the ZIP
    }
  };

  if (!activeFile) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#cccccc',
        fontSize: '16px',
      }}>
        No file selected
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <EditorTabs
        tabs={tabs}
        activeTabId={editorStore.activeFileId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
      />
      <MonacoEditor
        value={activeContent}
        language={getLanguageFromExtension(getFileExtension(activeFile.name))}
        onChange={handleEditorChange}
        onSave={handleSave}
      />
    </div>
  );
};
