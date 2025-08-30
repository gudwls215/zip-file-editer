import React, { useRef, useEffect, useCallback } from 'react';
// Ensure Monaco workers are wired before any editor actions
import '../../setup/monacoWorkers';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../store/editorStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const MonacoEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { 
    getActiveTab, 
    updateTabContent, 
    theme, 
    fontSize, 
    wordWrap, 
    minimap,
    markTabSaved,
    removeTab
  } = useEditorStore();

  const activeTab = getActiveTab();
  
  // Debug logging
  console.log('MonacoEditor render - activeTab:', activeTab?.name);

  const handleSave = useCallback(() => {
    if (activeTab) {
      console.log('Saving tab:', activeTab.name);
      markTabSaved(activeTab.id);
      // Here you would implement actual save logic
    }
  }, [activeTab, markTabSaved]);

  const handleCloseTab = useCallback(() => {
    if (activeTab) {
      if (activeTab.isDirty) {
        const shouldClose = window.confirm(
          `${activeTab.name} has unsaved changes. Do you want to close it anyway?`
        );
        if (!shouldClose) return;
      }
      removeTab(activeTab.id);
    }
  }, [activeTab, removeTab]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onCloseTab: handleCloseTab,
    onSearch: () => {
      editorRef.current?.getAction('actions.find')?.run();
    },
    onReplace: () => {
      editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
    }
  });

  const handleEditorChange = useCallback(() => {
    if (!editorRef.current || !activeTab) return;
    
    const value = editorRef.current.getValue();
    if (value !== activeTab.content) {
      updateTabContent(activeTab.id, value);
    }
  }, [activeTab, updateTabContent]);

  // Create Monaco Editor instance
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Create editor instance
    const editor = monaco.editor.create(containerRef.current, {
      value: activeTab?.content || '',
      language: activeTab?.language === 'image' ? 'plaintext' : (activeTab?.language || 'plaintext'),
      theme: theme,
      fontSize,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      lineNumbers: 'on',
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: wordWrap ? 'on' : 'off',
      folding: true,
      glyphMargin: true,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      mouseWheelZoom: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'off',
      smoothScrolling: false
    });

    editorRef.current = editor;
    console.log('Monaco Editor initialized successfully');

    // Setup keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => {
        editor.trigger('keyboard', 'redo', {});
      }
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      handleCloseTab();
    });

    // Listen for content changes
    editor.onDidChangeModelContent(handleEditorChange);

    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor when active tab changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    // Update content
    const currentValue = editorRef.current.getValue();
    if (currentValue !== activeTab.content) {
      editorRef.current.setValue(activeTab.content);
    }

    // Update language
    if (activeTab.language !== 'image') {
      const model = editorRef.current.getModel();
      if (model) {
        try {
          monaco.editor.setModelLanguage(model, activeTab.language);
          console.log('Language set to:', activeTab.language);
        } catch (langError) {
          console.warn('Failed to set language:', activeTab.language, langError);
          monaco.editor.setModelLanguage(model, 'plaintext');
        }
      }
    }
  }, [activeTab]);

  // Update editor options when settings change
  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      theme,
      fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap }
    });
  }, [theme, fontSize, wordWrap, minimap]);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsaved = useEditorStore.getState().hasUnsavedChanges();
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!activeTab) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#cccccc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Monaco Editor
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999999',
            fontStyle: 'italic'
          }}>
            Select a file from the tree to edit
          </div>
        </div>
      </div>
    );
  }

  if (activeTab.language === 'image') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src={activeTab.content} 
            alt={activeTab.name}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              border: '1px solid #464647',
              borderRadius: '4px'
            }}
          />
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#999999'
          }}>
            {activeTab.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: 'calc(100% - 22px)'
        }}
      />
      
      {/* Status bar for current file */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '22px',
        backgroundColor: '#007acc',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        fontSize: '11px',
        color: '#ffffff',
        zIndex: 1000
      }}>
        <span>{activeTab.name}</span>
        <span style={{ marginLeft: '12px', opacity: 0.8 }}>
          {activeTab.language}
        </span>
        {activeTab.isDirty && (
          <span style={{ marginLeft: '12px', opacity: 0.8 }}>
            • Modified
          </span>
        )}
        <span style={{ marginLeft: 'auto', marginRight: '12px', opacity: 0.6 }}>
          Editor Ready: {editorRef.current ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
};
