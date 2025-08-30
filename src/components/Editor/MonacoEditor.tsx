import React, { useRef, useEffect, useCallback } from "react";
// Import Monaco workers setup
import "../../setup/monacoWorkers";
import * as monaco from "monaco-editor";
import { useEditorStore } from "../../store/editorStore";
import { useZipStore } from "../../store/zipStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { MonacoService } from "../../services/monacoService";

export const MonacoEditor: React.FC = () => {
  const isProgrammaticChange = useRef(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const monacoSvcRef = useRef(MonacoService.getInstance());
  const prevActiveIdRef = useRef<string | null>(null);
  const {
    getActiveTab,
    updateTabContent,
    theme,
    fontSize,
    wordWrap,
    minimap,
    markTabSaved,
    removeTab,
    setTabViewState,
  } = useEditorStore();
  const { setSavedChange } = useZipStore();

  const activeTab = getActiveTab();

  // Debug logging
  console.log("MonacoEditor render - activeTab:", activeTab?.name);

  const handleSave = useCallback(() => {
    if (activeTab) {
      const value = editorRef.current?.getValue() ?? activeTab.content;
      console.log("Saving tab:", activeTab.name);
      // snapshot saved content for downloads
      setSavedChange(activeTab.path, value);
      if (value !== activeTab.content) {
        updateTabContent(activeTab.id, value);
      }
      markTabSaved(activeTab.id);
    }
  }, [activeTab, markTabSaved, setSavedChange, updateTabContent]);

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
      editorRef.current?.getAction("actions.find")?.run();
    },
    onReplace: () => {
      editorRef.current
        ?.getAction("editor.action.startFindReplaceAction")
        ?.run();
    },
  });

  const handleEditorChange = useCallback(() => {
    if (!editorRef.current) return;
    if (isProgrammaticChange.current) return;
    const value = editorRef.current.getValue();
    const currentActive = useEditorStore.getState().getActiveTab();
    if (!currentActive) return;
    if (value !== currentActive.content) {
      updateTabContent(currentActive.id, value);
    }
  }, [updateTabContent]);

  // Create Monaco Editor instance
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Ensure Monaco service is initialized
    monacoSvcRef.current.initialize().catch(() => {
      /* no-op */
    });

    // Create editor without initial value; we'll set model per-tab below
    const editor = monaco.editor.create(containerRef.current, {
      theme: theme,
      fontSize,
      fontFamily:
        '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      lineNumbers: "on",
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: wordWrap ? "on" : "off",
      folding: true,
      glyphMargin: true,
      renderWhitespace: "selection",
      tabSize: 2,
      insertSpaces: true,
      mouseWheelZoom: true,
      cursorBlinking: "blink",
      cursorSmoothCaretAnimation: "off",
      smoothScrolling: false,
    });

    editorRef.current = editor;
    console.log("Monaco Editor initialized successfully");

    // Setup keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => {
        editor.trigger("keyboard", "redo", {});
      }
    );

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger("keyboard", "undo", {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      handleCloseTab();
    });

    // Listen for content changes (ignore programmatic updates)
    editor.onDidChangeModelContent(() => {
      if (isProgrammaticChange.current) return;
      handleEditorChange();
    });

    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor when active tab changes: switch models to preserve per-file undo/redo
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Save view state of previously active tab (tracked in ref)
    const prevActiveId = prevActiveIdRef.current;
    if (prevActiveId && prevActiveId !== activeTab?.id) {
      try {
        const viewState = editor.saveViewState();
        setTabViewState(prevActiveId, viewState);
      } catch {}
    }

    if (!activeTab) {
      editor.setModel(null);
      return;
    }

    if (activeTab.language === "image") {
      editor.setModel(null);
      return;
    }

    const targetUri = monaco.Uri.file(activeTab.path);
    const targetUriStr = targetUri.toString();
    // Get or create model for this file
    let model = monaco.editor.getModel(targetUri);
    if (!model) {
      model = monaco.editor.createModel(
        activeTab.content,
        activeTab.language || "plaintext",
        targetUri
      );
    }

    // Only switch model if different from current to preserve cursor on content updates
    const currentModel = editor.getModel();
    const switchedModel =
      !currentModel || currentModel.uri.toString() !== targetUriStr;
    if (switchedModel) {
      editor.setModel(model);
    }

    // If model exists but content diverged (e.g., opened from ZIP again), reconcile without losing undo stack
    if (model.getValue() !== activeTab.content) {
      // Apply edit to update model while keeping undo/redo and preserve cursor
      isProgrammaticChange.current = true;
      const fullRange = model.getFullModelRange();
      const prevSel = editor.getSelection();
      editor.executeEdits("sync-content", [
        { range: fullRange, text: activeTab.content },
      ]);
      model.pushStackElement();
      // Restore selection to a valid position
      if (prevSel) {
        try {
          const pos = model.validatePosition(prevSel.getPosition());
          editor.setPosition(pos);
        } catch {}
      }
      isProgrammaticChange.current = false;
    }

    // Restore view state only when the model actually changed (e.g., tab switch)
    if (switchedModel) {
      const vs = activeTab.viewState;
      if (vs) {
        try {
          editor.restoreViewState(vs);
        } catch {}
      }
    }
    editor.focus();

    // Update prev active id for next switch
    prevActiveIdRef.current = activeTab.id;
  }, [activeTab, setTabViewState]);

  // Update editor options when settings change
  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.updateOptions({
      theme,
      fontSize,
      wordWrap: wordWrap ? "on" : "off",
      minimap: { enabled: minimap },
    });
  }, [theme, fontSize, wordWrap, minimap]);

  // Cleanup models for closed tabs to avoid memory leaks (keeps history for open tabs only)
  const openTabs = useEditorStore((state) => state.tabs);
  useEffect(() => {
    const openUris = new Set(
      openTabs.map((t) => monaco.Uri.file(t.path).toString())
    );
    monaco.editor.getModels().forEach((m) => {
      const u = m.uri.toString();
      if (!openUris.has(u)) {
        m.dispose();
      }
    });
  }, [openTabs]);

  // Warn before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsaved = useEditorStore.getState().hasUnsavedChanges();
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (!activeTab) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          color: "#cccccc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            Monaco Editor
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999999",
              fontStyle: "italic",
            }}
          >
            Select a file from the tree to edit
          </div>
        </div>
      </div>
    );
  }

  if (activeTab.language === "image") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src={activeTab.content}
            alt={activeTab.name}
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              border: "1px solid #464647",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#999999",
            }}
          >
            {activeTab.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100% - 22px)",
        }}
      />

      {/* Status bar for current file */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "22px",
          backgroundColor: "#007acc",
          display: "flex",
          alignItems: "center",
          paddingLeft: "12px",
          fontSize: "11px",
          color: "#ffffff",
          zIndex: 1000,
        }}
      >
        <span>{activeTab.name}</span>
        <span style={{ marginLeft: "12px", opacity: 0.8 }}>
          {activeTab.language}
        </span>
        {activeTab.isDirty && (
          <span style={{ marginLeft: "12px", opacity: 0.8 }}>• Modified</span>
        )}
        <span style={{ marginLeft: "auto", marginRight: "12px", opacity: 0.6 }}>
          Editor Ready: {editorRef.current ? "Yes" : "No"}
        </span>
      </div>
    </div>
  );
};
