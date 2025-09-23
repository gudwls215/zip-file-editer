import JSZip from "jszip";
import type { FileItem, FileNode } from "../types";
import {
  generateFileId,
  isTextFile,
  getFileExtension,
  isBinaryFile,
} from "../utils/fileUtils";

/**
 * ZipService - ZIP 파일 처리 전담 서비스
 *
 * 설계 원칙:
 * - 싱글톤 패턴: 앱 전체에서 단일 인스턴스 사용
 * - 순수 함수형: 사이드 이펙트 최소화
 * - 에러 처리: 명확한 에러 메시지와 복구 가능한 실패 처리
 * - 타입 안전성: 완전한 TypeScript 지원
 *
 * 핵심 기능:
 * - ZIP 파일 추출 및 파싱
 * - 텍스트/바이너리 파일 구분 처리
 * - 디렉토리 구조 보존
 * - ZIP 파일 생성 및 압축
 * - 메모리 효율적인 스트림 처리
 */
export class ZipService {
  private static instance: ZipService;
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  /**
   * 싱글톤 인스턴스 반환
   *
   * ZIP 처리 로직의 일관성 보장과 메모리 절약
   */
  static getInstance(): ZipService {
    if (!ZipService.instance) {
      ZipService.instance = new ZipService();
    }
    return ZipService.instance;
  }

  /**
   * ZIP 파일 추출 및 파싱
   *
   * 처리 과정:
   * 1. JSZip으로 ZIP 파일 로드
   * 2. 각 엔트리를 순회하며 파일/디렉토리 구분
   * 3. 텍스트 파일은 내용 읽기, 바이너리는 메타데이터만
   * 4. FileItem 배열로 변환하여 반환
   *
   * 에러 처리:
   * - 손상된 ZIP 파일
   * - 메모리 부족
   * - 인코딩 문제
   */
  async extractZipFile(file: File): Promise<FileItem[]> {
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      const files: FileItem[] = [];

      for (const [path, zipEntry] of Object.entries(zipData.files)) {
        if (zipEntry.dir) {
          // 디렉토리 처리
          files.push({
            id: generateFileId(),
            name: path.split("/").filter(Boolean).pop() || path,
            path: path,
            type: "directory",
            lastModified: zipEntry.date || new Date(),
          });
        } else {
          // 파일 처리
          let content: string | undefined;

          // 텍스트 파일인지 확인하여 내용 읽기
          if (isTextFile(path)) {
            try {
              content = await zipEntry.async("text");
            } catch {
              // 텍스트 디코딩 실패 시 바이너리로 처리
              content = "[Binary content - cannot display as text]";
            }
          }

          files.push({
            id: generateFileId(),
            name: path.split("/").pop() || path,
            path: path,
            type: "file",
            size: 0, // JSZip은 압축 해제된 크기에 쉽게 접근할 수 없음
            content,
            lastModified: zipEntry.date || new Date(),
          });
        }
      }

      return files;
    } catch (error) {
      console.error("Error extracting ZIP file:", error);
      throw new Error("Failed to extract ZIP file");
    }
  }

  /**
   * 파일 목록으로부터 ZIP 파일 생성
   *
   * 처리 과정:
   * 1. 새 JSZip 인스턴스 생성
   * 2. 각 파일/디렉토리를 ZIP에 추가
   * 3. Blob 형태로 압축하여 반환
   *
   * 사용 사례:
   * - 편집된 파일들을 ZIP으로 다운로드
   * - 새로 생성된 파일들을 포함한 ZIP 생성
   */
  async createZipFile(files: FileItem[]): Promise<Blob> {
    try {
      const zip = new JSZip();

      files.forEach((file) => {
        if (file.type === "directory") {
          // 빈 디렉토리 생성
          zip.folder(file.path);
        } else if (file.content) {
          // 파일 내용과 함께 추가
          zip.file(file.path, file.content);
        }
      });

      // Blob 형태로 ZIP 파일 생성
      return await zip.generateAsync({ type: "blob" });
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      throw new Error("Failed to create ZIP file");
    }
  }

  /**
   * ZIP 파일을 FileNode 트리 구조로 파싱
   *
   * 목적:
   * - 파일 트리 컴포넌트에서 사용할 계층적 구조 생성
   * - 부모-자식 관계를 명확히 표현
   * - 가상화된 트리 렌더링 지원
   *
   * 처리 알고리즘:
   * 1. 루트 노드 생성
   * 2. 경로 기반 맵으로 노드 추적
   * 3. 경로를 정렬하여 부모 디렉토리 먼저 처리
   * 4. 각 엔트리를 적절한 부모에 연결
   *
   * 성능 최적화:
   * - Map을 사용한 O(1) 노드 조회
   * - 정렬된 경로로 한 번의 순회만 필요
   */
  async parseZipFile(file: File): Promise<FileNode> {
    const arrayBuffer = await file.arrayBuffer();
    this.zip = await JSZip.loadAsync(arrayBuffer);

    // 루트 노드 초기화
    const rootNode: FileNode = {
      id: "root",
      name: file.name.replace(".zip", ""),
      path: "",
      type: "directory",
      children: [],
    };

    // 경로별 노드 추적을 위한 맵
    const pathMap = new Map<string, FileNode>();
    pathMap.set("", rootNode);

    // 경로 정렬로 부모 디렉토리 우선 처리
    const entries = Object.entries(this.zip.files);
    entries.sort(([a], [b]) => a.localeCompare(b));

    for (const [relativePath, zipEntry] of entries) {
      if (relativePath.endsWith("/")) {
        // 디렉토리 처리
        const dirPath = relativePath.slice(0, -1);
        const dirName = dirPath.split("/").pop() || "";
        const parentPath = dirPath.substring(0, dirPath.lastIndexOf("/"));

        // 디렉토리 노드 생성
        const dirNode: FileNode = {
          id: `dir-${dirPath}`,
          name: dirName,
          path: dirPath,
          type: "directory",
          children: [],
        };

        // 부모 디렉토리에 연결
        const parent = pathMap.get(parentPath) || rootNode;
        if (!parent.children) parent.children = [];
        parent.children.push(dirNode);
        pathMap.set(dirPath, dirNode);
      } else {
        // 파일 처리
        const fileName = relativePath.split("/").pop() || "";
        const parentPath = relativePath.substring(
          0,
          relativePath.lastIndexOf("/")
        );
        const isBinary = isBinaryFile(fileName);

        // 파일 내용 읽기 (바이너리/텍스트 구분)
        let content: string | ArrayBuffer;
        if (isBinary) {
          // 바이너리 파일은 ArrayBuffer로 저장
          content = await zipEntry.async("arraybuffer");
        } else {
          // 텍스트 파일은 문자열로 저장
          content = await zipEntry.async("text");
        }

        // 파일 노드 생성
        const fileNode: FileNode = {
          id: `file-${relativePath}`,
          name: fileName,
          path: relativePath,
          type: "file",
          content,
          size: 0, // JSZip은 압축 해제 크기 제공하지 않음
          extension: getFileExtension(fileName),
          modified: false, // 초기 상태는 수정되지 않음
        };

        // 부모 디렉토리에 연결
        const parent = pathMap.get(parentPath) || rootNode;
        if (!parent.children) parent.children = [];
        parent.children.push(fileNode);
      }
    }

    return rootNode;
  }

  /**
   * FileNode 트리로부터 ZIP 파일 생성
   *
   * 사용 목적:
   * - 편집된 파일 트리를 새로운 ZIP으로 내보내기
   * - 수정/추가/삭제된 파일들을 반영한 ZIP 생성
   * - 원본 디렉토리 구조 보존
   *
   * 재귀 알고리즘:
   * 1. 루트 노드부터 시작하여 DFS 순회
   * 2. 디렉토리는 JSZip.folder()로 생성
   * 3. 파일은 내용과 함께 JSZip.file()로 추가
   * 4. 전체 경로를 올바르게 구성
   *
   * 데이터 타입 처리:
   * - 텍스트 파일: string 타입으로 저장
   * - 바이너리 파일: ArrayBuffer 타입으로 저장
   */
  async createZipFromTree(rootNode: FileNode): Promise<Blob> {
    const newZip = new JSZip();

    // 재귀적으로 노드를 ZIP에 추가하는 헬퍼 함수
    const addToZip = (node: FileNode, parentPath: string = "") => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

      if (node.type === "file" && node.content !== undefined) {
        // 파일 내용 추가 (텍스트/바이너리 모두 처리)
        if (typeof node.content === "string") {
          newZip.file(fullPath, node.content);
        } else {
          // ArrayBuffer인 경우 (바이너리 파일)
          newZip.file(fullPath, node.content);
        }
      } else if (node.type === "directory" && node.children) {
        // 디렉토리 생성 (빈 디렉토리도 보존)
        if (fullPath) {
          newZip.folder(fullPath);
        }
        // 자식 노드들 재귀적으로 처리
        node.children.forEach((child) => addToZip(child, fullPath));
      }
    };

    // 루트 노드의 자식들부터 처리 시작
    if (rootNode.children) {
      rootNode.children.forEach((child) => addToZip(child, ""));
    }

    // Blob 형태로 ZIP 파일 생성
    return await newZip.generateAsync({ type: "blob" });
  }

  /**
   * 유효한 ZIP 파일인지 확인
   *
   * 검증 기준:
   * - 파일 확장자 기반 검사
   * - ZIP 계열 형식 지원 (.zip, .jar, .war, .ear)
   *
   * 보안 고려사항:
   * - 파일 확장자는 신뢰할 수 없는 정보
   * - 실제 파일 헤더 검증은 JSZip.loadAsync()에서 수행
   */
  isValidZipFile(file: File): boolean {
    const validExtensions = [".zip", ".jar", ".war", ".ear"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    return validExtensions.includes(extension);
  }
}
