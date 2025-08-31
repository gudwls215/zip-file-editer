import React, { useCallback, useRef } from "react";
import { FileUploadArea } from "../FileUpload/FileUploadArea";
import { OptimizedFileTree } from "../FileTree/OptimizedFileTree";
import { EditorContainer } from "../Editor/EditorContainer";
import { useZipStore } from "../../store/zipStore";
import addFileIcon from "../../assets/add_file.svg";
import addFolderIcon from "../../assets/add_folder.svg";
import uploadIcon from "../../assets/upload.svg";

const AppLayout: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const { addFile, addFolder } = useZipStore();

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
            width: "300px",
            backgroundColor: "#252526",
            borderRight: "1px solid #464647",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
