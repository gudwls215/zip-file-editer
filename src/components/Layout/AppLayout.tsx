import React, { useCallback, useRef, useState, useEffect } from "react";
import { FileUploadArea } from "../FileUpload/FileUploadArea";
import { OptimizedFileTree } from "../FileTree/OptimizedFileTree";
import { EditorContainer } from "../Editor/EditorContainer";
import { useZipStore } from "../../store/zipStore";
import addFileIcon from "../../assets/add_file.svg";
import addFolderIcon from "../../assets/add_folder.svg";
import uploadIcon from "../../assets/upload.svg";

/**
 * AppLayout - 메인 애플리케이션 레이아웃 컴포넌트
 *
 * 역할:
 * - VS Code 스타일의 전체 레이아웃 구성 (Title Bar + Upload + Sidebar + Editor)
 * - 리사이즈 가능한 사이드바 구현 (마우스 드래그)
 * - 파일/폴더 추가 액션 처리
 * - ZIP 파일 업로드 처리
 *
 * 기술적 특징:
 * - 상태 기반 리사이징: sidebarWidth로 동적 폭 조절
 * - 이벤트 델리게이션: document 레벨 마우스 이벤트 처리
 * - 메모리 누수 방지: useEffect cleanup으로 이벤트 리스너 제거
 *
 * 성능 최적화:
 * - useCallback으로 핸들러 메모이제이션
 * - 드래그 중 body 스타일 조작으로 UX 향상
 * - 최소/최대 폭 제한으로 UI 안정성 보장
 */
const AppLayout: React.FC = () => {
  // 파일 업로드용 ref - 숨겨진 input 엘리먼트 제어
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const { addFile, addFolder } = useZipStore();

  // 리사이즈 가능한 사이드바 상태 관리
  const [sidebarWidth, setSidebarWidth] = useState(300); // 기본 300px
  const [isResizing, setIsResizing] = useState(false); // 드래그 중 여부
  const resizeRef = useRef<HTMLDivElement>(null); // 드래그 핸들 ref

  // 마우스 드래그 시작 - 리사이징 모드 활성화
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault(); // 기본 드래그 동작 방지
  }, []);

  // 마우스 이동 - 실시간 사이드바 폭 조절
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX; // 마우스 X 좌표가 곧 사이드바 폭
      // UI 안정성을 위한 최소/최대 폭 제한
      const clampedWidth = Math.max(200, Math.min(800, newWidth));
      setSidebarWidth(clampedWidth);
    },
    [isResizing]
  );

  // 마우스 놓기 - 리사이징 모드 해제 및 정리
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    // resize handle의 시각적 피드백 초기화
    if (resizeRef.current) {
      resizeRef.current.style.backgroundColor = "transparent";
    }
  }, []);

  // 전역 마우스 이벤트 관리 - 드래그 중 document 레벨 이벤트 처리
  useEffect(() => {
    if (isResizing) {
      // 드래그 중: 전역 이벤트 리스너 등록
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize"; // 커서 변경
      document.body.style.userSelect = "none"; // 텍스트 선택 방지
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleAddFile = useCallback(() => {
    addFile(null, "new-file.txt", "");
  }, [addFile]);

  const handleAddFolder = useCallback(() => {
    addFolder(null, "new-folder");
  }, [addFolder]);

  const handleUploadClick = useCallback(() => {
    fileUploadRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const content = await file.text();
            addFile(null, file.name, content);
          }
        } catch (error) {
          console.error("Error uploading files:", error);
          alert("Failed to upload files");
        }
      }
      // 파일 입력 초기화
      if (e.target) {
        e.target.value = "";
      }
    },
    [addFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (!file.name.toLowerCase().endsWith(".zip")) {
          alert("Please upload a ZIP file");
          return;
        }

        // ZIP 파일 업로드 처리
        try {
          const { setZipData, setError, setLoading } = useZipStore.getState();

          setLoading(true);
          setError(null);

          // 에디터 스토어에서 탭 닫기
          const editorStore = await import("../../store/editorStore");
          editorStore.useEditorStore.getState().closeAllTabs();

          const arrayBuffer = await file.arrayBuffer();
          const JSZip = (await import("jszip")).default;
          const zip = new JSZip();
          const zipData = await zip.loadAsync(arrayBuffer);

          setZipData({
            zipFile: zipData,
            fileName: file.name,
            originalBuffer: arrayBuffer,
          });
        } catch (error) {
          console.error("Error processing ZIP file:", error);
          useZipStore.getState().setError("Failed to process ZIP file");
        } finally {
          useZipStore.getState().setLoading(false);
        }
      }
    },
    []
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        color: "#cccccc",
        fontFamily:
          '"Segoe UI", "Segoe WPC", "Segoe UI Symbol", "Helvetica Neue", sans-serif',
        fontSize: "13px",
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          height: "35px",
          background: "linear-gradient(to bottom, #3c3c3c, #2d2d30)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #464647",
          fontSize: "14px",
          fontWeight: "400",
          letterSpacing: "0.5px",
        }}
      >
        Zip File Editor
      </div>

      {/* File Upload Section */}
      <div
        style={{
          height: "120px",
          backgroundColor: "#252526",
          borderBottom: "1px solid #464647",
          padding: "12px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <FileUploadArea />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar - File Tree */}
        <div
          style={{
            width: `${sidebarWidth}px`,
            backgroundColor: "#252526",
            borderRight: "1px solid #464647",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "35px",
              backgroundColor: "#2d2d30",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: "12px",
              paddingRight: "8px",
              borderBottom: "1px solid #464647",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#a0a0a0",
              }}
            >
              Files
            </span>

            {/* 액션 버튼들 */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={handleAddFile}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s ease",
                }}
                title="Add File"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3e3e3e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <img src={addFileIcon} alt="add_file" width={14} height={14} />
              </button>

              <button
                onClick={handleAddFolder}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s ease",
                }}
                title="Add Folder"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3e3e3e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <img
                  src={addFolderIcon}
                  alt="add_folder"
                  width={14}
                  height={14}
                />
              </button>

              <button
                onClick={handleUploadClick}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.15s ease",
                }}
                title="Upload Files"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3e3e3e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <img src={uploadIcon} alt="upload" width={14} height={14} />
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
            }}
          >
            <OptimizedFileTree />
          </div>

          {/* Resize Handle */}
          <div
            ref={resizeRef}
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              top: 0,
              right: -3,
              width: "6px",
              height: "100%",
              cursor: "ew-resize",
              backgroundColor: isResizing ? "#007acc" : "transparent",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = "#007acc";
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          />
        </div>

        {/* Right Content Area - Integrated Editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <EditorContainer />
        </div>
      </div>

      {/* 숨겨진 파일 입력 요소들 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <input
        ref={fileUploadRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default AppLayout;
