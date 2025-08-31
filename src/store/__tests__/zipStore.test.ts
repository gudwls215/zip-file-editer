import { describe, it, expect, beforeEach, vi } from "vitest";
import { useZipStore } from "../zipStore";
import JSZip from "jszip";

// JSZip 목킹
vi.mock("jszip");

describe("ZipStore", () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 상태 초기화
    useZipStore.setState({
      zipFile: null,
      fileName: null,
      originalBuffer: null,
      fileTree: [],
      savedChanges: {},
      tabs: [],
      activeTabId: null,
      isLoading: false,
      error: null,
    });
  });

  describe("기본 상태 관리", () => {
    it("빈 상태로 초기화되어야 함", () => {
      const store = useZipStore.getState();

      expect(store.zipFile).toBeNull();
      expect(store.fileName).toBeNull();
      expect(store.fileTree).toEqual([]);
      expect(store.tabs).toEqual([]);
      expect(store.savedChanges).toEqual({});
    });

    it("로딩 상태를 설정할 수 있어야 함", () => {
      const { setLoading } = useZipStore.getState();

      setLoading(true);
      expect(useZipStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useZipStore.getState().isLoading).toBe(false);
    });

    it("should set error state", () => {
      const { setError } = useZipStore.getState();

      setError("Test error");
      expect(useZipStore.getState().error).toBe("Test error");

      setError(null);
      expect(useZipStore.getState().error).toBeNull();
    });
  });

  describe("탭 관리", () => {
    it("새 탭을 추가할 수 있어야 함", () => {
      const { addTab } = useZipStore.getState();

      const newTab = {
        id: "tab1",
        name: "test.js",
        path: "test.js",
        content: 'console.log("test");',
        language: "javascript",
        isDirty: false,
      };

      addTab(newTab);

      const state = useZipStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]).toEqual(newTab);
      expect(state.activeTabId).toBe("tab1");
    });

    it("중복된 탭을 추가하지 않아야 함", () => {
      const { addTab } = useZipStore.getState();

      const tab1 = {
        id: "tab1",
        name: "test.js",
        path: "test.js",
        content: 'console.log("test");',
        language: "javascript",
        isDirty: false,
      };

      const tab2 = {
        id: "tab2",
        name: "test.js",
        path: "test.js", // 같은 경로
        content: 'console.log("test2");',
        language: "javascript",
        isDirty: false,
      };

      addTab(tab1);
      addTab(tab2); // 추가되지 않고 기존 탭만 활성화되어야 함

      const state = useZipStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.activeTabId).toBe("tab1");
    });

    it("탭을 제거할 수 있어야 함", () => {
      const { addTab, removeTab } = useZipStore.getState();

      const tab1 = {
        id: "tab1",
        name: "test1.js",
        path: "test1.js",
        content: 'console.log("test1");',
        language: "javascript",
        isDirty: false,
      };

      const tab2 = {
        id: "tab2",
        name: "test2.js",
        path: "test2.js",
        content: 'console.log("test2");',
        language: "javascript",
        isDirty: false,
      };

      addTab(tab1);
      addTab(tab2);

      removeTab("tab1");

      const state = useZipStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toBe("tab2");
      expect(state.activeTabId).toBe("tab2");
    });

    it("should update tab content", () => {
      const { addTab, updateTabContent } = useZipStore.getState();

      const tab = {
        id: "tab1",
        name: "test.js",
        path: "test.js",
        content: 'console.log("test");',
        language: "javascript",
        isDirty: false,
      };

      addTab(tab);
      updateTabContent("tab1", 'console.log("updated");');

      const state = useZipStore.getState();
      expect(state.tabs[0].content).toBe('console.log("updated");');
      expect(state.tabs[0].isDirty).toBe(true);
    });
  });

  describe("저장된 변경사항", () => {
    it("저장된 변경사항을 설정해야 함", () => {
      const { setSavedChange } = useZipStore.getState();

      setSavedChange("test.js", "new content");

      const state = useZipStore.getState();
      expect(state.savedChanges["test.js"]).toBe("new content");
    });

    it("저장된 변경사항을 제거해야 함", () => {
      const { setSavedChange, removeSavedChange } = useZipStore.getState();

      setSavedChange("test.js", "content");
      setSavedChange("other.js", "other content");

      removeSavedChange("test.js");

      const state = useZipStore.getState();
      expect(state.savedChanges["test.js"]).toBeUndefined();
      expect(state.savedChanges["other.js"]).toBe("other content");
    });

    it("모든 저장된 변경사항을 지워야 함", () => {
      const { setSavedChange, clearSavedChanges } = useZipStore.getState();

      setSavedChange("test1.js", "content1");
      setSavedChange("test2.js", "content2");

      clearSavedChanges();

      const state = useZipStore.getState();
      expect(state.savedChanges).toEqual({});
    });
  });

  describe("파일 트리 관리", () => {
    it("파일 트리를 설정해야 함", () => {
      const { setFileTree } = useZipStore.getState();

      const tree = [
        {
          id: "file1",
          name: "test.js",
          path: "test.js",
          type: "file" as const,
        },
      ];

      setFileTree(tree);

      const state = useZipStore.getState();
      expect(state.fileTree).toEqual(tree);
    });
  });

  describe("초기화 기능", () => {
    it("모든 상태를 초기화해야 함", () => {
      const { addTab, setSavedChange, setError, setLoading, reset } =
        useZipStore.getState();

      // 상태 설정
      addTab({
        id: "tab1",
        name: "test.js",
        path: "test.js",
        content: "test",
        language: "javascript",
        isDirty: false,
      });
      setSavedChange("test.js", "content");
      setError("error");
      setLoading(true);

      reset();

      const state = useZipStore.getState();
      expect(state.zipFile).toBeNull();
      expect(state.fileName).toBeNull();
      expect(state.fileTree).toEqual([]);
      expect(state.tabs).toEqual([]);
      expect(state.savedChanges).toEqual({});
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });
});
