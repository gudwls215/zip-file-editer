import type { FileItem } from "../types";

/**
 * FileService - 파일 입출력 전담 서비스
 *
 * 설계 철학:
 * - 웹 환경에서의 파일 처리 추상화
 * - FileReader API의 안전한 래핑
 * - 메모리 효율적인 파일 다운로드
 * - 브라우저 호환성 보장
 *
 * 핵심 기능:
 * - 텍스트/바이너리 파일 읽기
 * - 파일 다운로드 처리
 * - Blob URL 생성 및 정리
 * - 에러 처리 및 메모리 누수 방지
 *
 * 사용 패턴:
 * - 싱글톤으로 앱 전체에서 일관된 파일 처리
 * - Promise 기반 비동기 API
 */
export class FileService {
  private static instance: FileService;

  /**
   * 싱글톤 인스턴스 반환
   *
   * 파일 처리 로직의 일관성과 메모리 절약 보장
   */
  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * 파일을 텍스트로 읽기
   *
   * 사용 사례:
   * - 소스 코드 파일 편집
   * - JSON, XML 등 텍스트 기반 설정 파일
   * - README, 문서 파일
   *
   * 에러 처리:
   * - 파일 읽기 실패 시 명확한 에러 메시지
   * - Promise reject로 비동기 에러 전파
   */
  async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  /**
   * 파일을 ArrayBuffer로 읽기
   *
   * 사용 사례:
   * - 이미지, 동영상 등 바이너리 파일
   * - 실행 파일, 압축 파일
   * - 커스텀 바이너리 형식 처리
   *
   * 메모리 고려사항:
   * - 대용량 파일의 경우 메모리 사용량 증가
   * - 스트림 처리가 필요한 경우 다른 방법 고려
   */
  async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 파일 다운로드 처리
   *
   * 동작 과정:
   * 1. Blob 객체 생성 (메모리 효율적)
   * 2. Object URL 생성으로 다운로드 링크 제공
   * 3. 가상의 <a> 엘리먼트로 다운로드 트리거
   * 4. DOM 정리 및 메모리 해제
   *
   * 보안 고려사항:
   * - 브라우저의 다운로드 정책 준수
   * - MIME 타입 명시로 안전한 다운로드
   */
  downloadFile(
    content: string,
    filename: string,
    contentType = "text/plain"
  ): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    // 임시 다운로드 링크 생성 및 클릭
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 메모리 누수 방지를 위한 URL 해제
    URL.revokeObjectURL(url);
  }

  /**
   * Blob 객체를 파일로 다운로드
   *
   * 특징:
   * - 이미 생성된 Blob 객체를 직접 다운로드
   * - ZIP 파일, 이미지 등 바이너리 데이터에 최적화
   * - createObjectURL/revokeObjectURL 패턴 사용
   *
   * 사용 사례:
   * - 편집된 ZIP 파일 다운로드
   * - 생성된 이미지 파일 저장
   * - 변환된 바이너리 데이터 내보내기
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);

    // 다운로드 링크 생성 및 실행
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Object URL 해제로 메모리 정리
    URL.revokeObjectURL(url);
  }

  validateFile(file: File, maxSize: number, allowedTypes: string[]): boolean {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not supported`);
    }

    return true;
  }

  async processFiles(files: FileList | File[]): Promise<FileItem[]> {
    const fileArray = Array.from(files);
    const processedFiles: FileItem[] = [];

    for (const file of fileArray) {
      try {
        const content = await this.readFileAsText(file);
        processedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          path: file.name,
          type: "file",
          size: file.size,
          content,
          lastModified: new Date(file.lastModified),
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
      }
    }

    return processedFiles;
  }

  static updateFileInTree(path: string, content: string | ArrayBuffer): void {
    // This would be implemented when we have a global store access
    console.log(
      "Updating file in tree:",
      path,
      "Content length:",
      content instanceof ArrayBuffer ? content.byteLength : content.length
    );
  }

  static getFileContent(path: string): string | ArrayBuffer | undefined {
    // This would be implemented when we have a global store access
    console.log("Getting file content:", path);
    return undefined;
  }

  static isModified(path: string): boolean {
    // This would be implemented when we have a global store access
    console.log("Checking if modified:", path);
    return false;
  }

  static hasModifiedFiles(): boolean {
    // This would be implemented when we have a global store access
    console.log("Checking for modified files");
    return false;
  }
}
