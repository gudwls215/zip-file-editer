import { useCallback } from "react";
import { ZipService } from "../services/zipService";
import { FileService } from "../services/fileService";
import type { FileItem } from "../types";

/**
 * useZipHandler Hook
 *
 * 목적:
 * - ZIP 파일 처리 관련 로직 캡슐화
 * - ZipService와 FileService 통합 인터페이스 제공
 * - 컴포넌트에서 사용하기 쉬운 ZIP 처리 API
 *
 * 설계 특징:
 * - 서비스 레이어의 추상화된 인터페이스
 * - 에러 처리 및 검증 로직 내장
 * - 재사용 가능한 ZIP 처리 함수들
 * - useCallback으로 성능 최적화
 *
 * 사용 패턴:
 * - 파일 업로드 컴포넌트에서 ZIP 처리
 * - 다운로드 버튼에서 ZIP 생성
 * - 드래그 앤 드롭 시 파일 타입 검증
 */
export const useZipHandler = () => {
  const zipService = ZipService.getInstance();
  const fileService = FileService.getInstance();

  /**
   * ZIP 파일 추출
   *
   * 기능:
   * - ZIP 파일 유효성 검사
   * - ZIP 내부 파일들을 FileItem 배열로 변환
   * - 텍스트/바이너리 파일 구분 처리
   *
   * 에러 처리:
   * - 유효하지 않은 ZIP 파일 검사
   * - 추출 과정에서 발생하는 에러 전파
   */
  const extractZip = useCallback(
    async (file: File): Promise<FileItem[]> => {
      if (!zipService.isValidZipFile(file)) {
        throw new Error("Invalid ZIP file");
      }

      return await zipService.extractZipFile(file);
    },
    [zipService]
  );

  /**
   * FileItem 배열로부터 ZIP 파일 생성
   *
   * 기능:
   * - 파일 목록을 ZIP Blob으로 압축
   * - 디렉토리 구조 보존
   * - 텍스트/바이너리 콘텐츠 처리
   *
   * 반환값:
   * - Blob 객체 (다운로드 또는 추가 처리 가능)
   */
  const createZip = useCallback(
    async (files: FileItem[]): Promise<Blob> => {
      return await zipService.createZipFile(files);
    },
    [zipService]
  );

  /**
   * ZIP 파일 생성 및 다운로드
   *
   * 통합 기능:
   * 1. FileItem 배열로부터 ZIP 생성
   * 2. 생성된 ZIP을 즉시 다운로드
   * 3. 에러 발생 시 명확한 메시지 제공
   *
   * 사용 사례:
   * - "Download as ZIP" 버튼 클릭 시
   * - 편집된 파일들을 아카이브로 저장
   * - 백업 및 공유 목적
   */
  const downloadZip = useCallback(
    async (files: FileItem[], filename = "archive.zip") => {
      try {
        const zipBlob = await zipService.createZipFile(files);
        fileService.downloadBlob(zipBlob, filename);
      } catch (error) {
        throw new Error(
          `Failed to create ZIP: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [zipService, fileService]
  );

  /**
   * ZIP 파일 여부 검사
   *
   * 검증 기준:
   * - 파일 확장자 기반 (.zip, .jar, .war, .ear)
   * - 빠른 검사로 드래그 앤 드롭 시 즉시 피드백
   *
   * 사용 용도:
   * - 드래그 오버 시 허용 파일 표시
   * - 파일 선택 시 처리 방법 결정
   * - UI 상태 업데이트
   */
  const isZipFile = useCallback(
    (file: File): boolean => {
      return zipService.isValidZipFile(file);
    },
    [zipService]
  );

  /**
   * Hook 반환값 - ZIP 처리 유틸리티 함수들
   *
   * 제공 함수:
   * - extractZip: ZIP 파일 추출
   * - createZip: ZIP 파일 생성
   * - downloadZip: ZIP 생성 및 다운로드
   * - isZipFile: ZIP 파일 여부 검사
   */
  return {
    extractZip,
    createZip,
    downloadZip,
    isZipFile,
  };
};
