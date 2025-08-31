import AppLayout from "./components/Layout/AppLayout";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import "./styles/global.css";
import "./styles/themes/dark.css";

function App() {
  return (
    <div className="theme-dark">
      <AppLayout />
      <PerformanceMonitor />
    </div>
  );
}

export default App;
