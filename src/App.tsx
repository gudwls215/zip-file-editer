import AppLayout from "./components/Layout/AppLayout";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { ThemeSelector } from "./components/ThemeSelector";
import { MonacoMemoryMonitor } from "./components/Monaco/MonacoMemoryMonitor";
import { AppSuspenseProvider } from "./components/Suspense/LazyComponents";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import "./styles/global.css";
import "./styles/themes/dark.css";

/**
 * 🏗️ 함수형 컴포넌트 기반 선언적 앱 아키텍처
 * 
 * React 18의 함수형 패러다임을 활용한 구조:
 * 1. 최상위 ErrorBoundary - 전역 에러 처리
 * 2. AppSuspenseProvider - 전역 지연 로딩 관리
 * 3. 기능별 컴포넌트 분리 - 단일 책임 원칙
 */
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        //  전역 에러 핸들링
        console.error('앱 레벨 에러:', error);
        console.error('에러 정보:', errorInfo);
        
        // 프로덕션에서 에러 리포팅 서비스로 전송
        if (process.env.NODE_ENV === 'production') {
          // sentry.captureException(error);
        }
      }}
    >
      <AppSuspenseProvider>
        <div className="theme-dark">
          <AppLayout />
          <PerformanceMonitor />
          <ThemeSelector />
          {/*  Monaco 메모리 관리 모니터 (Ctrl+Shift+M으로 토글) */}
          <MonacoMemoryMonitor />
        </div>
      </AppSuspenseProvider>
    </ErrorBoundary>
  );
}

export default App;
