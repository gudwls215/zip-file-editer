import AppLayout from "./components/Layout/AppLayout";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { ThemeSelector } from "./components/ThemeSelector";
import { MonacoMemoryMonitor } from "./components/Monaco/MonacoMemoryMonitor";
import "./styles/global.css";
import "./styles/themes/dark.css";

function App() {
  return (
    <div className="theme-dark">
      <AppLayout />
      <PerformanceMonitor />
      <ThemeSelector />
      {/* 🧠 Monaco 메모리 관리 모니터 (Ctrl+Shift+M으로 토글) */}
      <MonacoMemoryMonitor />
    </div>
  );
}

export default App;
