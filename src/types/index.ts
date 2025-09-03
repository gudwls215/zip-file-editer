/**
 * Types Index - 타입 정의 중앙 집중화
 *
 * 목적:
 * - 모든 타입 정의를 하나의 진입점으로 통합
 * - 모듈간 타입 의존성 관리 단순화
 * - Tree-shaking 최적화 지원
 *
 * 구조:
 * - file.types: 파일 시스템 관련 타입
 * - editor.types: Monaco Editor 관련 타입
 *
 * 사용법:
 * import { FileItem, EditorTab } from '@/types';
 */

// 파일 시스템 관련 타입들 (FileItem, FileNode, FileTreeNode 등)
export * from "./file.types";

// 에디터 관련 타입들 (EditorState, MonacoEditorProps, EditorTab 등)
export * from "./editor.types";
