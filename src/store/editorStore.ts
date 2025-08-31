import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean; // 수정 여부 - do/undo 기능의 기반이 되는 상태
  originalContent: string; // 저장된 원본 내용 (isDirty 상태 비교용)
  viewState?: any; // 에디터 뷰 상태 (커서 위치, 스크롤 등)
  lastModified?: Date; // 마지막 수정 시간
}

export interface EditorState {
  tabs: EditorTab[]; // 열린 탭들의 목록
  activeTabId: string | null; // 현재 활성화된 탭 ID
  theme: string; // 에디터 테마
  fontSize: number; // 글꼴 크기
  wordWrap: boolean; // 줄 바꿈 여부
  minimap: boolean; // 미니맵 표시 여부
}

export interface EditorActions {
  // 탭 관리 기능
  addTab: (tab: Omit<EditorTab, "id" | "isDirty" | "originalContent"> & { originalContent?: string }) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
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

  // 레거시 호환성 함수
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

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 초기 상태
      tabs: [],
      activeTabId: null,
      theme: "vs-dark",
      fontSize: 14,
      wordWrap: true,
      minimap: false,

      // 액션들
      addTab: (tabData) => {
        const id = `tab-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        console.log("EditorStore: 탭 추가 중", { id, tabData });

        set((state) => {
          // 같은 경로의 탭이 이미 존재하는지 확인
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

      removeTab: (tabId) => {
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === tabId);
          if (index === -1) return;

          // 탭 제거 (수정사항 손실 경고는 상위 컴포넌트에서 처리)
          state.tabs.splice(index, 1);

          // 활성 탭 재조정 - do/undo 히스토리도 함께 정리됨
          if (state.activeTabId === tabId) {
            if (state.tabs.length > 0) {
              const newIndex = Math.min(index, state.tabs.length - 1);
              state.activeTabId = state.tabs[newIndex]?.id || null;
            } else {
              state.activeTabId = null;
            }
          }
        });
      },

      setActiveTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            state.activeTabId = tabId;
            // 탭 전환 시 에디터의 do/undo 히스토리도 해당 탭의 상태로 복원됨
          }
        });
      },

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

      markTabSaved: (tabId) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (tab) {
            tab.isDirty = false; // 저장 시 더티 상태 해제 (do/undo 초기화 지점)
            tab.originalContent = tab.content; // 현재 내용을 새로운 원본으로 설정
          }
        });
      },

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
