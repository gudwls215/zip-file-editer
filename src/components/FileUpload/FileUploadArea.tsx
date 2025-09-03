import React, { useCallback, useState, useRef } from "react";
import JSZip from "jszip";
import { useZipStore } from "../../store/zipStore";
import { useEditorStore } from "../../store/editorStore";

/**
 * 📁 FileUploadArea - 파일 업로드 및 다운로드 컴포넌트
 *
 * 핵심 기능:
 * - Drag & Drop 및 클릭 업로드 지원
 * - ZIP 파일 검증 및 파싱
 * - 수정된 ZIP 파일 다운로드
 * - 업로드 전 에디터 상태 정리
 *
 * 기술적 특징:
 * - File API와 ArrayBuffer 활용: 브라우저 네이티브 파일 처리
 * - JSZip 라이브러리: ZIP 파일 파싱 및 재생성
 * - 비동기 처리: 대용량 파일 업로드 시 UI 블로킹 방지
 * - 메모리 관리: ArrayBuffer 원본 보존으로 다운로드 최적화
 *
 * UX 고려사항:
 * - 드래그 상태 시각적 피드백
 * - 로딩 상태 표시
 * - 에러 상태 처리 및 사용자 안내
 * - ZIP 파일만 허용하는 명확한 제약
 */
export const FileUploadArea: React.FC = () => {
  // UI 상태 관리
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 전역 상태 연결
  const {
    setZipData,
    setError,
    setLoading,
    isLoading,
    fileName,
    zipFile,
    error,
  } = useZipStore();

  const { closeAllTabs } = useEditorStore();

  /**
   * 파일 업로드 핸들러
   *
   * 처리 과정:
   * 1. ZIP 파일 형식 검증
   * 2. 기존 에디터 탭 정리 (메모리 누수 방지)
   * 3. ArrayBuffer로 파일 읽기
   * 4. JSZip으로 ZIP 구조 파싱
   * 5. 전역 상태에 저장
   *
   * 에러 처리:
   * - 파일 형식 불일치
   * - ZIP 파일 손상
   * - 메모리 부족 등
   */
  const handleFileUpload = useCallback(
    async (file: File) => {
      // ZIP 파일 형식 검증
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Please upload a ZIP file");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 새로운 ZIP 파일 로드 전에 모든 에디터 탭 닫기
        // → 메모리 누수 방지 및 상태 정리
        closeAllTabs();

        // File → ArrayBuffer 변환 (비동기)
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();

        // ZIP 파일 구조 파싱
        const zipData = await zip.loadAsync(arrayBuffer);

        // 전역 상태에 저장 (원본 버퍼도 보존)
        setZipData({
          zipFile: zipData,
          fileName: file.name,
          originalBuffer: arrayBuffer, // 다운로드 시 재사용
        });
      } catch (error) {
        console.error("Error processing ZIP file:", error);
        setError("Failed to process ZIP file");
      } finally {
        setLoading(false);
      }
    },
    [setZipData, setError, setLoading, closeAllTabs]
  );

  /**
   * 수정된 ZIP 파일 다운로드 핸들러
   *
   * 처리 과정:
   * 1. 현재 ZIP 상태에서 새로운 ZIP 생성
   * 2. Blob으로 변환하여 다운로드 링크 생성
   * 3. 브라우저 다운로드 트리거
   */
  const handleDownload = useCallback(async () => {
    if (!zipFile || !fileName) return;

    try {
      setLoading(true);

      // 수정된 파일들로 새로운 ZIP 생성
      const modifiedZip = new JSZip();

      // Copy all original files
      Object.keys(zipFile.files).forEach((path) => {
        const file = zipFile.files[path];
        if (!file.dir) {
          modifiedZip.file(path, file.async("uint8array"));
        }
      });

      // Apply only saved changes (저장된 변경사항만 반영)
      const { savedChanges } = useZipStore.getState();
      Object.entries(savedChanges).forEach(([path, content]) => {
        modifiedZip.file(path, content);
      });

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
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Failed to download file");
    } finally {
      setLoading(false);
    }
  }, [zipFile, fileName, setLoading, setError]);

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

  const savedChanges = useZipStore((state) => state.savedChanges);
  const hasStructuralChanges = useZipStore(
    (state) => state.hasStructuralChanges
  );
  const hasUnsavedChanges = useEditorStore((state) =>
    state.tabs.some((t) => t.isDirty)
  );
  const hasSavedModifications = Object.keys(savedChanges).length > 0;

  // 다운로드 가능 조건: ZIP 파일이 있고, 로딩 중이 아니며, 실제 변경사항이 있을 때
  const hasAnyChanges = hasSavedModifications || hasStructuralChanges;
  const canDownload = zipFile && !isLoading && hasAnyChanges;

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
              ? hasAnyChanges
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
              e.currentTarget.style.backgroundColor = hasAnyChanges
                ? "#1177bb"
                : "#5a5a5a";
            }
          }}
          onMouseLeave={(e) => {
            if (canDownload) {
              e.currentTarget.style.backgroundColor = hasAnyChanges
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
