/**
 * Editor Types - 에디터 관련 타입 정의
 *
 * 목적:
 * - Monaco Editor 통합을 위한 타입 시스템
 * - 멀티 탭 에디터 상태 관리
 * - 파일 편집 상태 및 변경 사항 추적
 *
 * 설계 철학:
 * - IDE와 유사한 사용자 경험 제공
 * - 탭 기반 멀티 파일 편집 지원
 * - 변경 사항 추적으로 데이터 손실 방지
 */

/**
 * EditorState - 에디터 전체 상태 관리
 *
 * 상태 구성:
 * - openFiles: 현재 열린 파일들의 ID 목록
 * - activeFileId: 현재 활성화된 탭의 파일 ID
 * - fileContents: 파일 내용 캐시 (메모리 효율성)
 * - unsavedChanges: 저장되지 않은 변경사항 추적
 *
 * 사용 패턴:
 * - Zustand 스토어에서 상태 관리
 * - React 컴포넌트에서 상태 구독
 * - 탭 전환 시 상태 보존
 */
export interface EditorState {
  openFiles: string[]; // 열린 파일 ID 목록
  activeFileId: string | null; // 현재 활성 파일 ID
  fileContents: Record<string, string>; // 파일 ID별 내용 캐시
  unsavedChanges: Record<string, boolean>; // 파일별 저장 필요 여부
}

/**
 * MonacoEditorProps - Monaco Editor 컴포넌트 프로퍼티
 *
 * 핵심 기능:
 * - value/onChange: 제어된 컴포넌트 패턴
 * - language: 문법 하이라이팅 및 언어 서비스
 * - onSave: Ctrl+S 단축키 처리
 * - theme: 다크/라이트 모드 지원
 * - readOnly: 읽기 전용 모드
 *
 * 타입스크립트 최적화:
 * - 모든 콜백 함수 타입 명시
 * - 옵셔널 프로퍼티로 유연성 제공
 */
export interface MonacoEditorProps {
  value: string; // 에디터 내용
  language: string; // 프로그래밍 언어 (typescript, javascript 등)
  onChange: (value: string) => void; // 내용 변경 콜백
  onSave?: () => void; // 저장 콜백 (Ctrl+S)
  theme?: string; // 테마 ('vs-dark', 'vs-light')
  readOnly?: boolean; // 읽기 전용 모드
}

/**
 * EditorTab - 개별 에디터 탭 정보
 *
 * 탭 관리 기능:
 * - id/path/name: 파일 식별 정보
 * - content: 현재 편집 중인 내용
 * - language: Monaco Editor 언어 모드
 * - isDirty: 저장 필요 여부 (탭 제목에 * 표시)
 * - viewState: 커서 위치, 스크롤 등 에디터 상태
 *
 * 성능 최적화:
 * - viewState 보존으로 탭 전환 시 편집 위치 유지
 * - 지연 로딩으로 메모리 효율성 확보
 */
export interface EditorTab {
  id: string; // 탭 고유 ID
  path: string; // 파일 경로
  name: string; // 탭에 표시될 파일명
  content: string; // 현재 편집 내용
  language: string; // Monaco 언어 ID
  isDirty: boolean; // 저장되지 않은 변경사항 여부
  viewState?: any; // Monaco Editor ViewState
  lastModified?: Date; // 최종 수정 시간
}

/**
 * MonacoInstance - Monaco Editor 인스턴스 관리
 *
 * 싱글톤 패턴 지원:
 * - editor: 메인 Monaco Editor 인스턴스
 * - models: 파일별 TextModel 캐시
 *
 * 멀티 모델 아키텍처:
 * - 각 파일마다 독립적인 TextModel 생성
 * - 탭 전환 시 모델 교체로 빠른 전환
 * - 메모리 관리 및 모델 라이프사이클 추적
 *
 * 성능 이점:
 * - 언어 서비스 캐싱 (IntelliSense, 에러 검사)
 * - 실행 취소/재실행 히스토리 보존
 */
export interface MonacoInstance {
  editor: any; // Monaco Editor 인스턴스
  models: Map<string, any>; // 파일 경로별 TextModel 맵
}
