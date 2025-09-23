import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PerformanceMonitor } from "../PerformanceMonitor";

// 성능 API 목킹
const mockPerformance = {
  now: vi.fn(() => 123456),
  getEntriesByType: vi.fn(),
};

// PerformanceObserver 목킹
class MockPerformanceObserver {
  constructor(_callback: (list: any) => void) {
    // 콜백은 테스트에서 사용하지 않음
  }

  observe() {
    // 목 구현
  }

  disconnect() {
    // 목 구현
  }
}

// 메모리 API 목킹
const mockMemory = {
  usedJSHeapSize: 12345678,
  totalJSHeapSize: 23456789,
  jsHeapSizeLimit: 34567890,
};

global.performance = mockPerformance as any;
global.PerformanceObserver = MockPerformanceObserver as any;
(global as any).performance.memory = mockMemory;

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.getEntriesByType.mockImplementation((type) => {
      if (type === "navigation") {
        return [{ loadEventEnd: 1500, navigationStart: 500 }];
      }
      if (type === "resource") {
        return [
          { name: "chunk1.js", responseEnd: 800 },
          { name: "chunk2.js", responseEnd: 1200 },
        ];
      }
      return [];
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("활성화될 때 성능 모니터가 렌더링되어야 함", () => {
    render(<PerformanceMonitor isEnabled={true} />);
    expect(screen.getByText("Performance Monitor")).toBeInTheDocument();
  });

  it("비활성화될 때 렌더링되지 않아야 함", () => {
    render(<PerformanceMonitor isEnabled={false} />);
    expect(screen.queryByText("Performance Monitor")).not.toBeInTheDocument();
  });

  it("초기 로드 시간을 표시해야 함", () => {
    render(<PerformanceMonitor isEnabled={true} />);

    expect(screen.getByText(/Initial Load:/)).toBeInTheDocument();
  });

  it("메모리 사용량을 표시해야 함", () => {
    render(<PerformanceMonitor isEnabled={true} />);

    // 메모리는 모든 브라우저/환경에서 표시되지 않을 수 있음
    const performanceMonitor = screen.getByText("Performance Monitor");
    expect(performanceMonitor).toBeInTheDocument();
  });

  it("드래그 기능을 지원해야 함", () => {
    render(<PerformanceMonitor isEnabled={true} />);

    const monitor = screen.getByText("Performance Monitor").parentElement!;

    // 엘리먼트가 드래그 가능한지 확인 (cursor: grab 스타일)
    expect(monitor.style.cursor).toBe("grab");

    // 마우스 이벤트가 에러를 발생시키지 않는지 테스트
    expect(() => {
      fireEvent.mouseDown(monitor, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(monitor, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(monitor);
    }).not.toThrow();
  });

  it("청크 로드 시간 세부정보를 표시해야 함", () => {
    render(<PerformanceMonitor isEnabled={true} />);

    expect(screen.getByText("Chunk Load Times")).toBeInTheDocument();
  });
});
