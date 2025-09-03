import React, { useRef, useEffect, useCallback } from "react";
// Monaco Editor가 로드될 때만 Monaco workers 설정 import
import "../../setup/monacoWorkers";
import * as monaco from "monaco-editor";
import { useEditorStore } from "../../store/editorStore";
import { useZipStore } from "../../store/zipStore";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { MonacoService } from "../../services/monacoService";

/**
 * MonacoEditor - VS Code 수준의 코드 에디터 컴포넌트
 *
 * 핵심 역할:
 * - Monaco Editor 인스턴스 생성 및 라이프사이클 관리
 * - 다중 탭 환경에서 파일별 독립적인 편집 모델 유지
 * - 실시간 내용 변경 감지 및 isDirty 상태 관리
 * - 키보드 단축키 처리 (Ctrl+S, Ctrl+Z, Ctrl+W 등)
 *
 * 고급 기능:
 * - Multi-model editor: 탭별 독립적인 Monaco 모델
 * - View state 보존: 커서 위치, 스크롤 위치, 선택 영역
 * - 프로그래밍적 변경 vs 사용자 변경 구분
 * - 메모리 누수 방지: 닫힌 탭의 모델 자동 정리
 *
 * 성능 최적화:
 * - isProgrammaticChange로 무한 루프 방지
 * - 모델 재사용으로 편집 히스토리 유지
 * - 탭 전환 시 뷰 상태 저장/복원
 */
export const MonacoEditor: React.FC = () => {
  // 무한 루프 방지: 프로그래밍적 변경 vs 사용자 입력 구분
  const isProgrammaticChange = useRef(false);

  // 에디터 인스턴스 및 DOM 참조
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 싱글톤 서비스 인스턴스
  const monacoSvcRef = useRef(MonacoService.getInstance());

  // 탭 전환 시 뷰 상태 관리용
  const prevActiveIdRef = useRef<string | null>(null);

  // 스토어 상태 및 액션
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

  // 디버깅용 로그 (인터뷰 시 제거 고려)
  console.log("MonacoEditor render - activeTab:", activeTab?.name);

  // 파일 저장 핸들러 - Ctrl+S 키 바인딩
  const handleSave = useCallback(() => {
    if (activeTab) {
      const value = editorRef.current?.getValue() ?? activeTab.content;
      console.log("Saving tab:", activeTab.name);

      // ZIP 다운로드용 스냅샷 저장
      setSavedChange(activeTab.path, value);

      // 에디터 내용이 변경된 경우에만 업데이트
      if (value !== activeTab.content) {
        updateTabContent(activeTab.id, value);
      }

      // 저장 완료 표시 (isDirty = false)
      markTabSaved(activeTab.id);
    }
  }, [activeTab, markTabSaved, setSavedChange, updateTabContent]);

  // 탭 닫기 핸들러 - 저장되지 않은 변경사항 확인
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

  // Monaco Editor 인스턴스 생성
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Monaco 서비스 초기화 확인
    monacoSvcRef.current.initialize().catch(() => {
      /* no-op */
    });

    // 초기값 없이 에디터 생성; 탭별로 모델을 설정할 예정
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

    // 키보드 단축키 설정
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
