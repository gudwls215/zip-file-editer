import React, { lazy, Suspense } from "react";
import styled from "styled-components";

// Monaco Editor를 동적으로 로드
const LazyMonacoEditor = lazy(() =>
  import("./MonacoEditor").then((module) => ({
    default: module.MonacoEditor,
  }))
);

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #1e1e1e;
  color: #cccccc;
  flex-direction: column;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #444444;
  border-top: 3px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: #999999;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #1e1e1e;
  color: #f48771;
  flex-direction: column;
  padding: 20px;
  text-align: center;
`;

const ErrorTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const ErrorMessage = styled.div`
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 16px;
`;

const RetryButton = styled.button`
  background-color: #007acc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background-color: #005999;
  }
`;

// Loading 컴포넌트
const MonacoLoading = () => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>Loading Monaco Editor...</LoadingText>
  </LoadingContainer>
);

// Error Boundary 컴포넌트
class MonacoErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Monaco Editor Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Failed to load Monaco Editor</ErrorTitle>
          <ErrorMessage>
            {this.state.error?.message || "Unknown error occurred"}
          </ErrorMessage>
          <RetryButton onClick={this.handleRetry}>Retry</RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// 메인 Lazy Monaco Editor 컴포넌트
export const LazyMonacoEditorWrapper: React.FC = () => {
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = React.useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  return (
    <MonacoErrorBoundary onRetry={handleRetry}>
      <Suspense fallback={<MonacoLoading />}>
        <LazyMonacoEditor key={retryKey} />
      </Suspense>
    </MonacoErrorBoundary>
  );
};
