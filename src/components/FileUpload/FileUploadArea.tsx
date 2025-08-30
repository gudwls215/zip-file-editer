import React, { useCallback, useState, useRef } from "react";
import JSZip from "jszip";
import { useZipStore } from "../../store/zipStore";
import { useEditorStore } from "../../store/editorStore";

export const FileUploadArea: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    setZipData,
    setError,
    setLoading,
    isLoading,
    fileName,
    zipFile,
    error,
  } = useZipStore();

  const { tabs, markTabSaved } = useEditorStore();

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Please upload a ZIP file");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        const zipData = await zip.loadAsync(arrayBuffer);

        setZipData({
          zipFile: zipData,
          fileName: file.name,
          originalBuffer: arrayBuffer,
        });
      } catch (error) {
        console.error("Error processing ZIP file:", error);
        setError("Failed to process ZIP file");
      } finally {
        setLoading(false);
      }
    },
    [setZipData, setError, setLoading]
  );

  const handleDownload = useCallback(async () => {
    if (!zipFile || !fileName) return;

    try {
      setLoading(true);

      // Create new zip with modified files
      const modifiedZip = new JSZip();

      // Copy all original files
      Object.keys(zipFile.files).forEach((path) => {
        const file = zipFile.files[path];
        if (!file.dir) {
          modifiedZip.file(path, file.async("uint8array"));
        }
      });

      // Apply saved changes first (explicit saves)
      const { savedChanges } = useZipStore.getState();
      Object.entries(savedChanges).forEach(([path, content]) => {
        modifiedZip.file(path, content);
      });

      // Then overlay any currently dirty tab content (unsaved but edited)
      for (const tab of tabs) {
        if (tab.isDirty) {
          modifiedZip.file(tab.path, tab.content);
        }
      }

      // Generate and download
      const blob = await modifiedZip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mark all tabs as saved and clear savedChanges snapshot
      tabs.forEach((tab) => {
        if (tab.isDirty) markTabSaved(tab.id);
      });
      useZipStore.getState().clearSavedChanges();
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Failed to download file");
    } finally {
      setLoading(false);
    }
  }, [zipFile, fileName, tabs, setLoading, setError, markTabSaved]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleClick = useCallback(() => {
    if (isLoading) return;
    fileInputRef.current?.click();
  }, [isLoading]);

  const hasModifications =
    useEditorStore((state) => state.tabs.some((t) => t.isDirty)) ||
    Object.keys(useZipStore.getState().savedChanges).length > 0;
  const canDownload = zipFile && !isLoading;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          style={{
            flex: 1,
            height: "80px",
            border: `2px dashed ${
              isDragOver ? "#007acc" : isLoading ? "#666666" : "#555555"
            }`,
            borderRadius: "6px",
            backgroundColor: isDragOver
              ? "#1a3a52"
              : isLoading
              ? "#2a2a2a"
              : "#2d2d30",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLoading ? "default" : "pointer",
            transition: "all 0.2s ease",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: isDragOver ? "#007acc" : "#cccccc",
              marginBottom: "4px",
            }}
          >
            {isLoading
              ? "Processing..."
              : "File Upload Handler (upload / download)"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#999999",
              textAlign: "center",
            }}
          >
            {isLoading
              ? "Please wait while we process your ZIP file"
              : fileName
              ? `Loaded: ${fileName}`
              : "Drop a ZIP file here or click to browse"}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!canDownload}
          style={{
            height: "80px",
            minWidth: "120px",
            backgroundColor: canDownload
              ? hasModifications
                ? "#0e639c"
                : "#4a4a4a"
              : "#3a3a3a",
            border: "none",
            borderRadius: "6px",
            color: canDownload ? "#ffffff" : "#888888",
            fontSize: "13px",
            fontWeight: "500",
            cursor: canDownload ? "pointer" : "not-allowed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "background-color 0.2s ease",
            opacity: canDownload ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (canDownload) {
              e.currentTarget.style.backgroundColor = hasModifications
                ? "#1177bb"
                : "#5a5a5a";
            }
          }}
          onMouseLeave={(e) => {
            if (canDownload) {
              e.currentTarget.style.backgroundColor = hasModifications
                ? "#0e639c"
                : "#4a4a4a";
            }
          }}
        >
          <div>Download</div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>Modified ZIP</div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#5a1d1d",
            border: "1px solid #e74c3c",
            borderRadius: "4px",
            color: "#ff6b6b",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
