import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

/**
 *  선언적 에러 처리를 위한 ErrorBoundary
 * 
 * React 18 함수형 컴포넌트 시대에도 ErrorBoundary는 클래스 컴포넌트로만 구현 가능
 * 하지만 사용은 선언적으로 함수형 컴포넌트에서 활용
 */

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
  border: 1px solid #f48771;
  border-radius: 8px;
  margin: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #f48771;
`;

const ErrorTitle = styled.h2`
  color: #ffffff;
  font-size: 24px;
  margin-bottom: 12px;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #cccccc;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 500px;
`;

const ErrorDetails = styled.details`
  margin-top: 16px;
  width: 100%;
  max-width: 600px;
  
  summary {
    color: #007acc;
    cursor: pointer;
    font-size: 12px;
    margin-bottom: 8px;
    
    &:hover {
      color: #4dc3ff;
    }
  }
`;

const ErrorStack = styled.pre`
  background: #1e1e1e;
  border: 1px solid #464647;
  border-radius: 4px;
  padding: 12px;
  font-size: 11px;
  color: #cccccc;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 200px;
`;

const RetryButton = styled.button`
  background: #007acc;
  border: none;
  color: white;
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #005a9e;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // 에러 격리 수준
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * 🛡️ 함수형 컴포넌트를 위한 선언적 에러 경계
 * 
 * @example
 * ```tsx
 * // 기본 사용법
 * <ErrorBoundary>
 *   <MonacoEditor />
 * </ErrorBoundary>
 * 
 * // 커스텀 폴백과 에러 핸들링
 * <ErrorBoundary 
 *   fallback={<CustomErrorUI />}
 *   onError={(error, info) => console.error('Monaco 에러:', error)}
 *   isolate={true}
 * >
 *   <MonacoEditor />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 다음 렌더링에서 폴백 UI 표시
    return { 
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 정보 저장 및 로깅
    this.setState({
      error,
      errorInfo
    });

    // 커스텀 에러 핸들러 실행
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }

    console.group(`🛡️ ErrorBoundary 에러 캐치: ${this.state.errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private reportErrorToService(_error: Error, _errorInfo: ErrorInfo) {
    // Sentry, LogRocket, 또는 커스텀 에러 리포팅 서비스
    // sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack
    //     }
    //   }
    // });
    console.log('에러 리포팅 서비스로 전송 (구현 예정)');
  }

  private handleRetry = () => {
    // 에러 상태 초기화로 재시도
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <ErrorContainer>
          <ErrorIcon>🚨</ErrorIcon>
          <ErrorTitle>앗! 문제가 발생했습니다</ErrorTitle>
          <ErrorMessage>
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            <br />
            문제가 지속되면 개발팀에 문의해주세요.
          </ErrorMessage>

          <RetryButton onClick={this.handleRetry}>
            🔄 다시 시도
          </RetryButton>

          {/* 개발 환경에서만 에러 상세 정보 표시 */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <summary>🔍 개발자 정보 (프로덕션에서 숨겨짐)</summary>
              <ErrorStack>
                <strong>Error ID:</strong> {this.state.errorId}
                {'\n\n'}
                <strong>Error Message:</strong>
                {'\n'}
                {this.state.error.message}
                {'\n\n'}
                <strong>Stack Trace:</strong>
                {'\n'}
                {this.state.error.stack}
                {'\n\n'}
                <strong>Component Stack:</strong>
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </ErrorStack>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

/**
 * 🎯 HOC 패턴을 활용한 선언적 에러 경계 래퍼
 * 
 * @example
 * ```tsx
 * const SafeMonacoEditor = withErrorBoundary(MonacoEditor, {
 *   fallback: <div>Monaco 에디터 로딩 실패</div>,
 *   onError: (error) => console.error('Monaco 에러:', error)
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * 🪝 함수형 컴포넌트용 에러 상태 훅
 * 
 * ErrorBoundary 외부에서 에러 상태를 관리할 때 사용
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    
    // 에러를 상위 ErrorBoundary로 전파
    throw error;
  }, []);

  return { error, resetError, captureError };
}

export default ErrorBoundary;