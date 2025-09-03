/**
 * File Types - 파일 시스템 관련 타입 정의
 *
 * 목적:
 * - 애플리케이션 전반에서 사용되는 파일 관련 타입 통합 관리
 * - 타입 안전성 보장으로 런타임 에러 방지
 * - 파일 트리, ZIP 처리, 에디터 연동을 위한 인터페이스 제공
 *
 * 설계 원칙:
 * - 명확한 책임 분리 (UI용/데이터용/상태용)
 * - 확장 가능한 구조 (옵셔널 프로퍼티 활용)
 * - 타입 유니온으로 명확한 구분 ('file' | 'directory')
 */

/**
 * FileItem - 기본 파일 정보 인터페이스
 *
 * 사용 용도:
 * - 파일 목록 표시
 * - 파일 업로드 결과 저장
 * - ZIP 내부 파일 표현
 *
 * 특징:
 * - 계층적 구조 지원 (children 프로퍼티)
 * - 텍스트 파일만 content 보유
 * - lastModified로 파일 변경 시점 추적
 */
export interface FileItem {
  id: string; // 고유 식별자 (UUID 등)
  name: string; // 파일/디렉토리 이름
  path: string; // 전체 경로
  type: "file" | "directory"; // 파일 타입 구분
  size?: number; // 파일 크기 (바이트)
  content?: string; // 텍스트 파일 내용
  children?: FileItem[]; // 하위 파일/디렉토리
  lastModified?: Date; // 최종 수정 시간
}

/**
 * FileNode - 에디터 및 ZIP 처리용 파일 노드
 *
 * FileItem과의 차이점:
 * - content가 ArrayBuffer | string (바이너리 지원)
 * - modified 플래그로 편집 상태 추적
 * - extension으로 파일 확장자 관리
 *
 * 사용 용도:
 * - Monaco Editor 모델 생성
 * - ZIP 파일 생성 시 데이터 소스
 * - 파일 변경 사항 추적
 */
export interface FileNode {
  id: string; // 고유 식별자
  name: string; // 파일/디렉토리 이름
  path: string; // 전체 경로
  type: "file" | "directory"; // 파일 타입
  children?: FileNode[]; // 하위 노드들
  content?: ArrayBuffer | string; // 파일 내용 (바이너리/텍스트)
  modified?: boolean; // 편집 여부 플래그
  size?: number; // 파일 크기
  extension?: string; // 파일 확장자 (.js, .ts 등)
}

/**
 * FileSystemState - 파일 시스템 전체 상태
 *
 * 상태 관리 전략:
 * - rootNode: 계층적 트리 구조 표현
 * - flatMap: O(1) 파일 조회를 위한 플랫 맵
 *
 * 성능 최적화:
 * - Map 자료구조로 빠른 파일 검색
 * - 트리와 맵 동기화로 효율적인 CRUD
 */
export interface FileSystemState {
  rootNode: FileNode | null; // 루트 디렉토리 노드
  flatMap: Map<string, FileNode>; // 경로 기반 빠른 조회용 맵
}

/**
 * FileContent - 파일 내용 및 타입 정보
 *
 * 타입 구분 목적:
 * - 'text': Monaco Editor에서 편집 가능
 * - 'binary': 바이너리 데이터 (실행파일 등)
 * - 'image': 이미지 미리보기 가능
 *
 * 렌더링 전략:
 * - 타입별로 다른 뷰어 컴포넌트 사용
 * - 메모리 효율적인 콘텐츠 로딩
 */
export type FileContent = {
  path: string; // 파일 경로
  content: string | ArrayBuffer; // 파일 내용
  type: "text" | "binary" | "image"; // 파일 타입 분류
};

/**
 * FileTreeNode - 가상화된 파일 트리 노드
 *
 * 가상 스크롤링 지원:
 * - depth: 트리 계층 깊이 (들여쓰기 계산)
 * - expanded: 폴더 열림/닫힘 상태
 * - parentId: 부모 노드 추적
 *
 * UI 최적화:
 * - 대용량 파일 트리의 효율적 렌더링
 * - 선택적 노드 확장으로 메모리 절약
 */
export interface FileTreeNode extends FileItem {
  expanded?: boolean; // 디렉토리 확장 상태
  depth: number; // 트리 깊이 레벨
  parentId?: string; // 부모 노드 ID
}

/**
 * ZipEntry - ZIP 파일 내부 엔트리 정보
 *
 * ZIP 처리 특화:
 * - filename: ZIP 내부 경로
 * - content: 압축 해제된 원본 데이터
 * - isDirectory: 디렉토리 여부 판단
 *
 * JSZip 라이브러리 연동:
 * - ZIP 파싱 결과를 표준화된 형태로 변환
 * - 크로스 플랫폼 ZIP 호환성 보장
 */
export interface ZipEntry {
  filename: string; // ZIP 내부 파일 경로
  content: Uint8Array; // 압축 해제된 바이너리 데이터
  isDirectory: boolean; // 디렉토리 여부
  size: number; // 압축 해제된 파일 크기
  lastModified: Date; // 파일 수정 시간
}
