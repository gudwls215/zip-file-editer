import { useEffect, useRef, useState } from "react";
import { MonacoService } from "../services/monacoService";

/**
 * useMonaco Hook
 *
 * 목적:
 * - Monaco Editor 초기화 및 상태 관리
 * - 에디터 준비 상태 추적
 * - 초기화 에러 처리
 * - MonacoService 인스턴스 제공
 *
 * 설계 특징:
 * - 싱글톤 MonacoService와 연동
 * - 로딩 상태 및 에러 상태 제공
 * - 재초기화 방지 (ref 사용)
 * - 컴포넌트별 Monaco 준비 상태 확인
 *
 * 사용 패턴:
 * - 에디터 컴포넌트에서 초기화 상태 확인
 * - 로딩 스피너 표시
 * - 에러 발생 시 대체 UI 제공
 */
export const useMonaco = () => {
  // Monaco Editor 준비 완료 상태
  const [isReady, setIsReady] = useState(false);
  // 초기화 중 발생한 에러
  const [error, setError] = useState<string | null>(null);
  // MonacoService 인스턴스 (재생성 방지)
  const monacoServiceRef = useRef<MonacoService | null>(null);

  useEffect(() => {
    /**
     * Monaco Editor 비동기 초기화
     *
     * 초기화 과정:
     * 1. MonacoService 싱글톤 인스턴스 획득
     * 2. Worker 설정 및 Monaco 라이브러리 로드
     * 3. 언어 서비스 및 테마 설정
     * 4. 준비 상태로 전환
     *
     * 에러 처리:
     * - CDN 로드 실패
     * - Worker 초기화 실패
     * - 브라우저 호환성 문제
     */
    const initMonaco = async () => {
      try {
        // 싱글톤 인스턴스 확보 (중복 초기화 방지)
        if (!monacoServiceRef.current) {
          monacoServiceRef.current = MonacoService.getInstance();
        }

        // Monaco Editor 비동기 초기화
        await monacoServiceRef.current.initializeMonaco();
        setIsReady(true);
      } catch (err) {
        // 사용자 친화적 에러 메시지 설정
        setError(
          err instanceof Error ? err.message : "Failed to initialize Monaco"
        );
      }
    };

    initMonaco();
  }, []); // 빈 의존성 배열로 한 번만 실행

  return {
    isReady, // Monaco 준비 완료 여부
    error, // 초기화 에러 메시지
    monacoService: monacoServiceRef.current, // MonacoService 인스턴스
  };
};
