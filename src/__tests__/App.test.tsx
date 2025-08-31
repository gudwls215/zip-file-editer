import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

// 무거운 컴포넌트들을 목킹
vi.mock("../components/Layout/AppLayout", () => ({
  default: () => <div data-testid="app-layout">App Layout</div>,
}));

vi.mock("../components/PerformanceMonitor", () => ({
  PerformanceMonitor: () => (
    <div data-testid="performance-monitor">Performance Monitor</div>
  ),
}));

vi.mock("../components/TestControlPanel", () => ({
  TestControlPanel: () => (
    <div data-testid="test-control-panel">Test Control Panel</div>
  ),
}));

describe("App 통합 테스트", () => {
  it("메인 앱 컴포넌트들이 렌더링되어야 함", () => {
    render(<App />);

    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
    expect(screen.getByTestId("performance-monitor")).toBeInTheDocument();
  });

  it("다크 테마 클래스가 적용되어야 함", () => {
    const { container } = render(<App />);

    const themeDiv = container.querySelector(".theme-dark");
    expect(themeDiv).toBeInTheDocument();
  });
});
