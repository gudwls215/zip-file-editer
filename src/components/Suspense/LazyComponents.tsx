import React, { Suspense, lazy } from 'react';
import styled, { keyframes } from 'styled-components';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

/**
 * ⚡ React 18 Suspense 기반 선언적 지연 로딩
 * 
 * 함수형 컴포넌트의 함수형 패러다임:
 * - 순수함수적 접근: 입력 → 컴포넌트 → 출력
 * - 선언적 코드: "무엇을"에 집중, "어떻게"는 React가 처리
 * - 합성 가능: 작은 함수들을 조합해 복잡한 기능 구현
 */

// 🎨 로딩 애니메이션 키프레임
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #464647;
  border-top: 3px solid #007acc;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  color: #cccccc;
  font-size: 14px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  text-align: center;
`;

const LoadingSubtext = styled.div`
  color: #888888;
  font-size: 11px;
  margin-top: 8px;
  text-align: center;
`;

/**
 * 📦 지연 로딩할 컴포넌트들 정의
 * 
 * lazy()는 함수형 프로그래밍의 지연 평가(Lazy Evaluation) 개념
 * 필요한 순간까지 평가를 미루어 성능 최적화
 */
const LazyMonacoEditor = lazy(() => 
  import('../Editor/MonacoEditor').then(module => ({
    default: module.MonacoEditor
  }))
);

const LazyFileTree = lazy(() => 
  import('../FileTree/OptimizedFileTree').then(module => ({
    default: module.OptimizedFileTree
  }))
);

const LazyMemoryMonitor = lazy(() =>
  import('../Monaco/MonacoMemoryMonitor').then(module => ({
    default: module.MonacoMemoryMonitor
  }))
);

/**
 * 🎯 특화된 로딩 컴포넌트들 (컴포넌트별 맞춤 피드백)
 */

// Monaco Editor 로딩 UI
export const MonacoEditorFallback: React.FC = () => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>Monaco Editor 로딩 중...</LoadingText>
    <LoadingSubtext>
      VS Code 수준의 편집 환경을 준비하고 있습니다
    </LoadingSubtext>
  </LoadingContainer>
);

// FileTree 로딩 UI
export const FileTreeFallback: React.FC = () => (
  <LoadingContainer style={{ minHeight: '200px' }}>
    <LoadingSpinner />
    <LoadingText>파일 트리 로딩 중...</LoadingText>
    <LoadingSubtext>
      파일 구조를 분석하고 있습니다
    </LoadingSubtext>
  </LoadingContainer>
);

// Memory Monitor 로딩 UI  
export const MemoryMonitorFallback: React.FC = () => (
  <LoadingContainer style={{ minHeight: '150px' }}>
    <LoadingSpinner />
    <LoadingText>메모리 모니터 초기화 중...</LoadingText>
    <LoadingSubtext>
      메모리 추적 시스템을 설정하고 있습니다
    </LoadingSubtext>
  </LoadingContainer>
);

/**
 * 🎭 선언적 Suspense 래퍼 컴포넌트들
 * 
 * 함수형 프로그래밍 원칙:
 * - 고차함수: 컴포넌트를 받아서 향상된 컴포넌트를 반환
 * - 불변성: 원본 컴포넌트를 변경하지 않고 새로운 래퍼 생성
 * - 순수성: 같은 입력에 대해 항상 같은 출력 보장
 */

interface LazyWrapperProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

//  Monaco Editor with Suspense + ErrorBoundary
export const SuspenseMonacoEditor: React.FC<LazyWrapperProps> = ({ 
  fallback = <MonacoEditorFallback />,
  errorFallback,
  onError
}) => (
  <ErrorBoundary 
    fallback={errorFallback} 
    onError={(error, _errorInfo) => {
      console.error('Monaco Editor 에러:', error);
      onError?.(error);
    }}
  >
    <Suspense fallback={fallback}>
      <LazyMonacoEditor />
    </Suspense>
  </ErrorBoundary>
);

// 🌳 FileTree with Suspense + ErrorBoundary
export const SuspenseFileTree: React.FC<LazyWrapperProps> = ({ 
  fallback = <FileTreeFallback />,
  errorFallback,
  onError
}) => (
  <ErrorBoundary 
    fallback={errorFallback}
    onError={(error, _errorInfo) => {
      console.error('FileTree 에러:', error);
      onError?.(error);
    }}
  >
    <Suspense fallback={fallback}>
      <LazyFileTree />
    </Suspense>
  </ErrorBoundary>
);

//  Memory Monitor with Suspense + ErrorBoundary
export const SuspenseMemoryMonitor: React.FC<LazyWrapperProps> = ({ 
  fallback = <MemoryMonitorFallback />,
  errorFallback,
  onError
}) => (
  <ErrorBoundary 
    fallback={errorFallback}
    onError={(error, _errorInfo) => {
      console.error('Memory Monitor 에러:', error);
      onError?.(error);
    }}
  >
    <Suspense fallback={fallback}>
      <LazyMemoryMonitor />
    </Suspense>
  </ErrorBoundary>
);

/**
 * 🏗️ 고차 컴포넌트: withSuspenseAndErrorBoundary
 * 
 * 함수형 프로그래밍의 커링(Currying) 개념 적용
 * 설정을 단계별로 받아서 최종 컴포넌트를 생성
 */
interface WithSuspenseOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error) => void;
  displayName?: string;
}

export function withSuspenseAndErrorBoundary(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>,
  options: WithSuspenseOptions = {}
) {
  const {
    fallback = <LoadingContainer><LoadingSpinner /><LoadingText>로딩 중...</LoadingText></LoadingContainer>,
    errorFallback,
    onError,
    displayName = 'LazyComponent'
  } = options;

  const WrappedComponent: React.FC<any> = (props) => (
    <ErrorBoundary 
      fallback={errorFallback}
      onError={(error, _errorInfo) => {
        console.error(`${displayName} 에러:`, error);
        onError?.(error);
      }}
    >
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withSuspenseAndErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

/**
 * 🎪 전체 앱을 위한 선언적 지연 로딩 제공자
 * 
 * React 18의 Concurrent Features 활용:
 * - Automatic Batching: 여러 상태 업데이트를 자동으로 배치
 * - Transitions: 긴급하지 않은 업데이트를 백그라운드에서 처리
 * - Suspense: 컴포넌트 트리의 일부분을 지연 로딩
 */
interface AppSuspenseProviderProps {
  children: React.ReactNode;
  globalFallback?: React.ReactNode;
  globalErrorFallback?: React.ReactNode;
}

export const AppSuspenseProvider: React.FC<AppSuspenseProviderProps> = ({
  children,
  globalFallback = (
    <LoadingContainer style={{ minHeight: '100vh' }}>
      <LoadingSpinner />
      <LoadingText>애플리케이션 로딩 중...</LoadingText>
      <LoadingSubtext>
        최고의 개발 경험을 위해 준비하고 있습니다
      </LoadingSubtext>
    </LoadingContainer>
  ),
  globalErrorFallback
}) => (
  <ErrorBoundary fallback={globalErrorFallback}>
    <Suspense fallback={globalFallback}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

/**
 * 🪝 선언적 지연 로딩을 위한 커스텀 훅
 * 
 * 함수형 프로그래밍의 클로저(Closure) 활용
 * 로딩 상태와 에러 상태를 캡슐화
 */
export function useLazyComponent<T>(
  lazyFactory: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [Component, setComponent] = React.useState<T | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    lazyFactory()
      .then((module) => {
        if (!cancelled) {
          setComponent(() => module.default);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { Component, isLoading, error };
}

export default {
  SuspenseMonacoEditor,
  SuspenseFileTree,
  SuspenseMemoryMonitor,
  withSuspenseAndErrorBoundary,
  AppSuspenseProvider,
  useLazyComponent
};