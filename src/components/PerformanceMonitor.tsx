import React, { useEffect, useState } from "react";

interface PerformanceMetrics {
  initialLoadTime: number;
  monacoLoadTime?: number;
  chunkLoadTimes: { [key: string]: number };
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  isEnabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isEnabled = process.env.NODE_ENV === "development",
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    initialLoadTime: 0,
    chunkLoadTimes: {},
  });

  useEffect(() => {
    if (!isEnabled) return;

    const measureInitialLoad = () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        setMetrics((prev) => ({ ...prev, initialLoadTime: loadTime }));
      }
    };

    const measureChunkLoads = () => {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const chunkLoadTimes: { [key: string]: number } = {};

      resources.forEach((resource) => {
        if (resource.name.includes(".js") && resource.name.includes("assets")) {
          const fileName = resource.name.split("/").pop() || "";
          chunkLoadTimes[fileName] =
            resource.responseEnd - resource.requestStart;
        }
      });

      setMetrics((prev) => ({ ...prev, chunkLoadTimes }));
    };

    const measureMemoryUsage = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    // Monaco 로딩 시간 측정
    const measureMonacoLoad = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes("monaco")) {
            setMetrics((prev) => ({
              ...prev,
              monacoLoadTime: entry.duration,
            }));
          }
        });
      });

      observer.observe({ entryTypes: ["measure", "resource"] });

      return () => observer.disconnect();
    };

    // 측정 실행
    setTimeout(() => {
      measureInitialLoad();
      measureChunkLoads();
      measureMemoryUsage();
    }, 100);

    const cleanup = measureMonacoLoad();

    // 주기적으로 메모리 사용량 업데이트
    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    return () => {
      cleanup();
      clearInterval(memoryInterval);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 10000,
        maxWidth: "300px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        Performance Monitor
      </div>

      <div>
        <strong>Initial Load:</strong> {Math.round(metrics.initialLoadTime)}ms
      </div>

      {metrics.monacoLoadTime && (
        <div>
          <strong>Monaco Load:</strong> {Math.round(metrics.monacoLoadTime)}ms
        </div>
      )}

      {metrics.memoryUsage && (
        <div>
          <strong>Memory:</strong> {Math.round(metrics.memoryUsage)}MB
        </div>
      )}

      <details style={{ marginTop: "8px" }}>
        <summary style={{ cursor: "pointer" }}>Chunk Load Times</summary>
        <div style={{ marginTop: "4px", fontSize: "11px" }}>
          {Object.entries(metrics.chunkLoadTimes).map(([chunk, time]) => (
            <div key={chunk} style={{ marginLeft: "8px" }}>
              {chunk.split("-")[0]}: {Math.round(time)}ms
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
