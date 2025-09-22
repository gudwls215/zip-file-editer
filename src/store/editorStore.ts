import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MonacoMemoryManager } from "../services/monacoMemoryManager";

/**
 * EditorTab - 에디터 탭 인터페이스
 *
 * 각 열린 파일의 상태를 관리하는 핵심 데이터 구조
 * VS Code의 탭 시스템을 모방한 설계
 */
export interface EditorTab {
  id: string; // 고유 식별자 (탭별 독립적 관리)
  name: string; // 파일명 (탭 제목으로 표시)
  path: string; // 파일 경로 (중복 탭 방지 키)
  content: string; // 현재 편집 중인 내용
  language: string; // 언어 타입 (syntax highlighting용)
  isDirty: boolean; // 수정 여부 - do/undo 기능의 기반이 되는 상태
  originalContent: string; // 저장된 원본 내용 (isDirty 상태 비교용)
  viewState?: any; // 에디터 뷰 상태 (커서 위치, 스크롤 등)
  lastModified?: Date; // 마지막 수정 시간
}

/**
 * EditorState - 에디터 전역 상태 인터페이스
 *
 * 모든 에디터 관련 상태를 중앙 집중 관리
 * Monaco Editor 설정과 탭 시스템을 통합
 */
export interface EditorState {
  tabs: EditorTab[]; // 열린 탭들의 목록
  activeTabId: string | null; // 현재 활성화된 탭 ID
  theme: string; // 에디터 테마 (vs-dark, vs-light 등)
  fontSize: number; // 글꼴 크기 (픽셀 단위)
  wordWrap: boolean; // 줄 바꿈 여부
  minimap: boolean; // 미니맵 표시 여부
}

/**
 * EditorActions - 에디터 액션 인터페이스
 *
 * 에디터 상태를 변경하는 모든 메서드를 정의
 * 불변성 유지와 타입 안전성을 보장
 */
export interface EditorActions {
  // 탭 관리 기능
  addTab: (
    tab: Omit<EditorTab, "id" | "isDirty" | "originalContent"> & {
      originalContent?: string;
    }
  ) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (draggedTabId: string, targetTabId: string) => void; // 🆕 드래그로 탭 순서 변경
  updateTabContent: (tabId: string, content: string) => void; // 콘텐츠 변경 시 isDirty=true 설정
  markTabSaved: (tabId: string) => void; // 저장 시 isDirty=false 설정 (do/undo 상태 리셋)
  setTabViewState: (tabId: string, viewState: any | null) => void;
  closeAllTabs: () => void;
  closeDirtyTabs: () => EditorTab[]; // 수정된 탭들 닫기 (저장되지 않은 변경사항 처리)

  // 에디터 설정
  setTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;

  // 유틸리티 함수
  getActiveTab: () => EditorTab | undefined;
  hasUnsavedChanges: () => boolean; // 저장되지 않은 변경사항 확인 (do/undo 관련)
  getDirtyTabs: () => EditorTab[]; // 수정된 탭들 목록 반환

  // 레거시 호환성 함수 (기존 코드와의 호환성 유지)
  openFile: (fileId: string, content: string) => void;
  openTab: (tabData: Omit<EditorTab, "id" | "isDirty">) => void;
  closeFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileSaved: (fileId: string) => void;
  clearTabs: () => void;
  closeAllFiles: () => void;
}

type EditorStore = EditorState & EditorActions;

/**
 * useEditorStore - 에디터 상태 관리 스토어
 *
 * 설계 특징:
 * - Zustand + Immer: 불변성 보장과 간편한 상태 업데이트
 * - subscribeWithSelector: 선택적 구독으로 성능 최적화
 * - 타입 안전성: 100% TypeScript 지원
 *
 * 아키텍처 패턴:
 * - 단일 진실 소스: 모든 에디터 상태를 중앙 관리
 * - 액션 기반 업데이트: 상태 변경은 명시적 액션을 통해서만
 * - 선택적 구독: 필요한 상태만 구독하여 불필요한 리렌더링 방지
 */
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 초기 상태 정의
      tabs: [],
      activeTabId: null,
      theme: "vs-dark", // VS Code 다크 테마 기본값
      fontSize: 14, // 읽기 좋은 기본 크기
      wordWrap: true, // 긴 줄 자동 줄바꿈 활성화
      minimap: false, // 성능을 위해 미니맵 비활성화

      // 액션 메서드들

      /**
       * 새 탭 추가 메서드
       *
       * 처리 과정:
       * 1. 고유 ID 생성 (타임스탬프 + 랜덤)
       * 2. 기본값 설정 (isDirty: false, originalContent 등)
       * 3. 탭 배열에 추가
       * 4. 생성된 탭 ID 반환
       */
      addTab: (tabData) => {
        const id = `tab-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        console.log("EditorStore: 탭 추가 중", { id, tabData });

        set((state) => {
          // 같은 경로의 탭이 이미 존재하는지 확인 (중복 방지)
          const existingTab = state.tabs.find(
            (tab) => tab.path === tabData.path
          );
          if (existingTab) {
            console.log(
              "EditorStore: 탭이 이미 존재함, 활성화:",
              existingTab.id
            );
            state.activeTabId = existingTab.id;
            return;
          }

          // 새 탭 객체 생성
          const newTab: EditorTab = {
            ...tabData,
            id,
            isDirty: false, // 새 탭은 수정되지 않은 상태로 시작 (do/undo 초기 상태)
            originalContent: tabData.originalContent ?? tabData.content, // 저장된 원본 내용으로 설정
            lastModified: new Date(),
          };

          console.log("EditorStore: 새 탭 생성:", newTab);
          state.tabs.push(newTab);
          state.activeTabId = id;
        });

        return id;
      },

      /**
       * 탭 제거 메서드 + 🧠 메모리 관리 통합
       *
       * 처리 과정:
       * 1. 대상 탭 찾기
       * 2. 🗑️ Monaco 모델 메모리 정리 (WeakSet 활용)
       * 3. 탭 배열에서 제거
       * 4. 활성 탭 재조정 (필요시)
       * 5. do/undo 히스토리 정리
       */
      removeTab: (tabId) => {
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === tabId);
          if (index === -1) return;

          // 🧠 핵심! Monaco 모델 메모리 정리
          const memoryManager = MonacoMemoryManager.getInstance();
          memoryManager.disposeModel(tabId);
          console.log(`🗑️ 탭 ${tabId} 메모리 정리 완료`);

          // 탭 제거 (수정사항 손실 경고는 상위 컴포넌트에서 처리)
          state.tabs.splice(index, 1);

          // 활성 탭 재조정 - do/undo 히스토리도 함께 정리됨
          if (state.activeTabId === tabId) {
            if (state.tabs.length > 0) {
              // 가능한 한 같은 위치나 가까운 탭으로 전환
              const newIndex = Math.min(index, state.tabs.length - 1);
              state.activeTabId = state.tabs[newIndex]?.id || null;
            } else {
              state.activeTabId = null;
            }
          }
        });
      },

      /**
       * 활성 탭 설정 메서드
       *
       * 탭 전환 시 Monaco 에디터의 뷰 상태도 함께 복원됨
       * (커서 위치, 스크롤 위치, 선택 영역 등)
       */
      setActiveTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            state.activeTabId = tabId;
            // 탭 전환 시 에디터의 do/undo 히스토리도 해당 탭의 상태로 복원됨
          }
        });
      },

      /**
       * 🚀 탭 순서 변경 메서드 (드래그 앤 드롭)
       *
       * VS Code와 같은 탭 드래그 기능 구현
       * 드래그된 탭을 타겟 탭 위치로 이동시킴
       */
      reorderTabs: (draggedTabId, targetTabId) => {
        set((state) => {
          const draggedIndex = state.tabs.findIndex(tab => tab.id === draggedTabId);
          const targetIndex = state.tabs.findIndex(tab => tab.id === targetTabId);

          // 유효하지 않은 인덱스 체크
          if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
            return;
          }

          // 배열에서 드래그된 탭을 제거하고 새 위치에 삽입
          const [draggedTab] = state.tabs.splice(draggedIndex, 1);
          state.tabs.splice(targetIndex, 0, draggedTab);

          console.log(`🔄 탭 이동: ${draggedTab.name} → 위치 ${targetIndex}`);
        });
      },

      /**
       * 탭 내용 업데이트 메서드
       *
       * 처리 과정:
       * 1. 대상 탭 찾기
       * 2. 내용 변경 확인
       * 3. isDirty 상태 계산 (원본과 비교)
       * 4. 수정 시간 업데이트
       */
      updateTabContent: (tabId, content) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            if (tab.content !== content) {
              tab.content = content;
              // 원본 내용과 비교해서 isDirty 상태 결정
              tab.isDirty = content !== tab.originalContent;
              tab.lastModified = new Date();
            }
          }
        });
      },

      /**
       * 탭 저장 완료 표시 메서드
       *
       * 저장 후 상태 초기화:
       * 1. isDirty를 false로 설정
       * 2. 현재 내용을 새로운 원본으로 저장
       * 3. do/undo 히스토리 초기화 지점 생성
       */
      markTabSaved: (tabId) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            tab.isDirty = false; // 저장 시 더티 상태 해제 (do/undo 초기화 지점)
            tab.originalContent = tab.content; // 현재 내용을 새로운 원본으로 설정
          }
        });
      },

      /**
       * 탭 뷰 상태 설정 메서드
       *
       * Monaco 에디터의 뷰 상태를 탭별로 저장
       * 탭 전환 시 마지막 상태 복원에 사용
       */
      setTabViewState: (tabId, viewState) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            // Monaco 에디터의 뷰 상태 저장 (커서 위치, 선택 영역, 스크롤 위치 등)
            tab.viewState = viewState || undefined;
          }
        });
      },

      closeAllTabs: () => {
        set((state) => {
          // 모든 탭 닫기 - 저장되지 않은 변경사항 주의
          state.tabs = [];
          state.activeTabId = null;
        });
      },

      closeDirtyTabs: () => {
        const dirtyTabs = get().tabs.filter((tab) => tab.isDirty);
        set((state) => {
          // 수정된 탭들만 닫기 (저장되지 않은 변경사항 처리)
          state.tabs = state.tabs.filter((tab) => !tab.isDirty);
          if (
            state.activeTabId &&
            dirtyTabs.some((tab) => tab.id === state.activeTabId)
          ) {
            state.activeTabId = state.tabs[0]?.id || null;
          }
        });
        return dirtyTabs;
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
      },

      setFontSize: (size) => {
        set((state) => {
          // 글꼴 크기는 8~32 사이로 제한
          state.fontSize = Math.max(8, Math.min(32, size));
        });
      },

      toggleWordWrap: () => {
        set((state) => {
          state.wordWrap = !state.wordWrap;
        });
      },

      toggleMinimap: () => {
        set((state) => {
          state.minimap = !state.minimap;
        });
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find((tab) => tab.id === activeTabId);
      },

      hasUnsavedChanges: () => {
        // 저장되지 않은 변경사항 존재 여부 확인 (do/undo 관련 상태 체크)
        return get().tabs.some((tab) => tab.isDirty);
      },

      getDirtyTabs: () => {
        // 수정된 탭들 목록 반환 (저장 필요한 파일들)
        return get().tabs.filter((tab) => tab.isDirty);
      },

      // 레거시 호환성 메서드들
      openFile: (fileId, content) => {
        const name = fileId.split("/").pop() || fileId;
        get().addTab({
          name,
          path: fileId,
          content,
          originalContent: content, // 초기 원본 내용 설정
          language: "javascript",
        });
      },

      openTab: (tabData) => {
        get().addTab({
          ...tabData,
          originalContent: tabData.content, // 초기 원본 내용 설정
        });
      },

      closeFile: (fileId) => {
        get().removeTab(fileId);
      },

      closeTab: (tabId) => {
        get().removeTab(tabId);
      },

      setActiveFile: (fileId) => {
        get().setActiveTab(fileId);
      },

      updateFileContent: (fileId, content) => {
        get().updateTabContent(fileId, content);
      },

      markFileSaved: (fileId) => {
        get().markTabSaved(fileId);
      },

      clearTabs: () => {
        get().closeAllTabs();
      },

      closeAllFiles: () => {
        get().closeAllTabs();
      },
    }))
  )
);

// 성능 최적화를 위한 셀렉터들
export const useActiveTab = () =>
  useEditorStore((state) => state.getActiveTab());
export const useHasUnsavedChanges = () =>
  useEditorStore((state) => state.hasUnsavedChanges()); // do/undo 관련 상태 확인
export const useDirtyTabs = () =>
  useEditorStore((state) => state.getDirtyTabs()); // 저장이 필요한 탭들
