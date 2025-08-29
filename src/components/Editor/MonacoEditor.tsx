import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { useZipStore } from '../../store/zipStore';

export const MonacoEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTabId, updateTabContent } = useZipStore();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco Editor
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });

    // Create editor instance
    const editor = monaco.editor.create(containerRef.current, {
      theme: 'vs-dark',
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      folding: true,
      glyphMargin: true,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      mouseWheelZoom: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true
    });

    editorRef.current = editor;

    // Setup keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log('Save shortcut triggered');
      // Save functionality can be added here
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

    // Setup content change handler
    const handleContentChange = () => {
      if (!activeTab) return;
      
      const content = editor.getValue();
      if (content !== activeTab.content) {
        updateTabContent(activeTab.id, content);
      }
    };

    const contentChangeDisposable = editor.onDidChangeModelContent(handleContentChange);

    return () => {
      contentChangeDisposable.dispose();
      editor.dispose();
    };
  }, []);

  // Update editor content when active tab changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    const editor = editorRef.current;
    
    if (activeTab.language === 'image') {
      // For images, we'll hide the editor and show the image
      return;
    }

    // Set language
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, activeTab.language);
    }

    // Set content without triggering change events
    const currentContent = editor.getValue();
    if (currentContent !== activeTab.content) {
      editor.setValue(activeTab.content);
    }
  }, [activeTab]);

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
          height: '100%',
          backgroundColor: '#1e1e1e'
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
      </div>
    </div>
  );
};
