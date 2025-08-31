import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global objects
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "mocked-url");
global.URL.revokeObjectURL = vi.fn();

// Mock performance API
Object.defineProperty(global, "performance", {
  value: {
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    },
  },
  writable: true,
});

// Mock PerformanceObserver
// global.PerformanceObserver = vi.fn().mockImplementation(() => ({
//   observe: vi.fn(),
//   disconnect: vi.fn(),
// }));
