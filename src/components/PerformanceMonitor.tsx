import React, { useEffect, useState, useRef } from "react";

interface PerformanceMetrics {
  initialLoadTime: number;
  monacoLoadTime?: number;
  chunkLoadTimes: { [key: string]: number };
  memoryUsage?: number;
}

interface Position {
  x: number;
  y: number;
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

  // 드래그 관련 상태
  const [position, setPosition] = useState<Position>({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const monitorRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 드래그 중
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // 화면 경계 제한
    const maxX = window.innerWidth - (monitorRef.current?.offsetWidth || 300);
    const maxY = window.innerHeight - (monitorRef.current?.offsetHeight || 200);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 초기 위치를 우측 하단으로 설정
  useEffect(() => {
    const setInitialPosition = () => {
      const width = 280; // 실제 모니터 너비에 맞게 조정
      const height = 180; // 실제 모니터 높이에 맞게 조정
      setPosition({
        x: window.innerWidth - width - 5, // 여백을 10px에서 5px로 줄임
        y: window.innerHeight - height - 5, // 여백을 10px에서 5px로 줄임
      });
    };

    // 컴포넌트 마운트 시와 리사이즈 시 위치 조정
    setInitialPosition();
    window.addEventListener("resize", setInitialPosition);
    return () => window.removeEventListener("resize", setInitialPosition);
  }, []);

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
      ref={monitorRef}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 10000,
        maxWidth: "300px",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        border: "1px solid #333",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px", cursor: "grab" }}>
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
