import { useCallback } from "react";
import { FileService } from "../services/fileService";
import { ZipService } from "../services/zipService";
import { useFileStore } from "../store/fileStore";
import { buildFileTree } from "../utils/treeUtils";
import type { FileItem } from "../types";

/**
 * useFileSystem Hook
 *
 * 목적:
 * - 파일 시스템 관련 비즈니스 로직 캡슐화
 * - 파일 업로드 및 처리 통합 관리
 * - ZIP 파일과 일반 파일의 통합 처리
 * - 파일 트리 구조 생성 및 관리
 *
 * 설계 원칙:
 * - 서비스 레이어와 스토어 연결
 * - 에러 처리 및 로딩 상태 관리
 * - 타입 안전성 보장
 * - 재사용 가능한 비즈니스 로직
 *
 * 핵심 기능:
 * - 파일 드래그 앤 드롭 처리
 * - ZIP 파일 자동 감지 및 추출
 * - 파일 트리 구조 생성
 * - 에러 상태 및 로딩 상태 관리
 */
export const useFileSystem = () => {
  const fileStore = useFileStore();
  const fileService = FileService.getInstance();
  const zipService = ZipService.getInstance();

  /**
   * 업로드된 파일들 처리
   *
   * 처리 과정:
   * 1. 로딩 상태 설정 및 에러 초기화
   * 2. 각 파일을 ZIP/일반 파일로 구분
   * 3. ZIP 파일은 추출하여 내부 파일들 처리
   * 4. 일반 파일은 직접 처리
   * 5. 모든 파일을 통합하여 파일 트리 생성
   * 6. 스토어에 결과 저장
   *
   * 에러 처리:
   * - 개별 파일 처리 실패 시 전체 중단
   * - 사용자 친화적 에러 메시지 제공
   * - 로딩 상태 정리
   */
  const processUploadedFiles = useCallback(
    async (files: FileList) => {
      fileStore.setLoading(true);
      fileStore.setError(null);

      try {
        const fileArray = Array.from(files);
        const processedFiles: FileItem[] = [];

        // 각 파일을 순차적으로 처리
        for (const file of fileArray) {
          if (zipService.isValidZipFile(file)) {
            // ZIP 파일 추출 및 내부 파일들 처리
            const extractedFiles = await zipService.extractZipFile(file);
            processedFiles.push(...extractedFiles);
          } else {
            // 일반 파일 직접 처리
            const regularFiles = await fileService.processFiles([file]);
            processedFiles.push(...regularFiles);
          }
        }

        // 파일 목록을 스토어에 저장
        fileStore.setFiles(processedFiles);

        // 계층적 파일 트리 구조 생성
        const tree = buildFileTree(processedFiles);
        fileStore.setFileTree(tree);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process files";
        fileStore.setError(errorMessage);
      } finally {
        // 성공/실패 관계없이 로딩 상태 해제
        fileStore.setLoading(false);
      }
    },
    [fileStore, fileService, zipService]
  );

  /**
   * 개별 파일 다운로드
   *
   * 동작 과정:
   * 1. 파일 ID로 파일 검색
   * 2. 파일 존재 및 내용 확인
   * 3. FileService를 통한 다운로드 실행
   *
   * 에러 처리:
   * - 파일을 찾을 수 없는 경우
   * - 파일 내용이 없는 경우 (바이너리 파일 등)
   * - 다운로드 실패 시 에러 상태 설정
   */
  const downloadFile = useCallback(
    (fileId: string) => {
      const file = fileStore.files.find((f) => f.id === fileId);
      if (!file || !file.content) {
        fileStore.setError("File not found or has no content");
        return;
      }

      // FileService를 통해 텍스트 파일 다운로드
      fileService.downloadFile(file.content, file.name);
    },
    [fileStore.files, fileService]
  );

  /**
   * 전체 파일을 ZIP으로 다운로드
   *
   * 사용 사례:
   * - 편집된 파일들을 하나의 ZIP으로 내보내기
   * - 원본 ZIP 파일의 수정된 버전 생성
   * - 백업 및 아카이브 목적
   *
   * 처리 과정:
   * 1. 로딩 상태 설정
   * 2. ZipService로 모든 파일을 ZIP Blob 생성
   * 3. FileService로 ZIP 파일 다운로드
   * 4. 에러 처리 및 로딩 상태 해제
   */
  const downloadAsZip = useCallback(async () => {
    fileStore.setLoading(true);
    try {
      // 모든 파일을 포함한 ZIP Blob 생성
      const zipBlob = await zipService.createZipFile(fileStore.files);
      // 생성된 ZIP 파일 다운로드
      fileService.downloadBlob(zipBlob, "archive.zip");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create ZIP file";
      fileStore.setError(errorMessage);
    } finally {
      fileStore.setLoading(false);
    }
  }, [fileStore, zipService, fileService]);

  /**
   * 파일 선택 상태 변경
   *
   * 목적:
   * - 파일 트리에서 선택된 파일 추적
   * - 에디터에서 표시할 파일 결정
   * - 컨텍스트 메뉴 및 액션 대상 지정
   */
  const selectFile = useCallback(
    (fileId: string) => {
      fileStore.setSelectedFileId(fileId);
    },
    [fileStore]
  );

  /**
   * 모든 파일 및 상태 초기화
   *
   * 사용 시점:
   * - 새로운 프로젝트 시작
   * - 에러 상태에서 초기화
   * - 메모리 정리 필요 시
   */
  const clearAllFiles = useCallback(() => {
    fileStore.clearFiles();
  }, [fileStore]);

  /**
   * Hook 반환값 - 파일 시스템 상태 및 액션들
   *
   * 상태값:
   * - files: 현재 로드된 모든 파일 목록
   * - fileTree: 계층적 파일 트리 구조
   * - selectedFileId: 현재 선택된 파일 ID
   * - isLoading: 파일 처리 중 로딩 상태
   * - error: 에러 메시지 (있는 경우)
   *
   * 액션 함수들:
   * - processUploadedFiles: 파일 업로드 처리
   * - downloadFile: 개별 파일 다운로드
   * - downloadAsZip: 전체 파일 ZIP 다운로드
   * - selectFile: 파일 선택
   * - clearAllFiles: 모든 파일 초기화
   */
  return {
    // 상태값들
    files: fileStore.files,
    fileTree: fileStore.fileTree,
    selectedFileId: fileStore.selectedFileId,
    isLoading: fileStore.isLoading,
    error: fileStore.error,

    // 액션 함수들
    processUploadedFiles,
    downloadFile,
    downloadAsZip,
    selectFile,
    clearAllFiles,
  };
};
