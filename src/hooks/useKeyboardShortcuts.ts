import { useEffect, useCallback } from "react";

/**
 * 키보드 단축키 콜백 함수 인터페이스
 *
 * IDE 스타일 단축키 지원:
 * - Ctrl/Cmd + S: 저장
 * - Ctrl/Cmd + O: 열기
 * - Ctrl/Cmd + W: 탭 닫기
 * - Ctrl/Cmd + T: 새 탭
 * - Ctrl/Cmd + B: 사이드바 토글
 * - Ctrl/Cmd + F: 검색
 * - Ctrl/Cmd + H: 찾기/바꾸기
 */
interface KeyboardShortcuts {
  onSave?: () => void;
  onOpen?: () => void;
  onCloseTab?: () => void;
  onNewTab?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onReplace?: () => void;
}

/**
 * useKeyboardShortcuts Hook
 *
 * 목적:
 * - 전역 키보드 단축키 처리
 * - IDE와 유사한 사용자 경험 제공
 * - 브라우저 기본 동작 오버라이드
 *
 * 설계 원칙:
 * - 옵셔널 콜백으로 유연성 제공
 * - preventDefault로 브라우저 기본 동작 차단
 * - 크로스 플랫폼 지원 (Ctrl/Cmd)
 *
 * 성능 최적화:
 * - useCallback으로 불필요한 리렌더 방지
 * - 이벤트 리스너 정리로 메모리 누수 방지
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, key } = event;
      // macOS는 metaKey (Cmd), Windows/Linux는 ctrlKey
      const isCtrlOrCmd = ctrlKey || metaKey;

      if (!isCtrlOrCmd) return;

      switch (key.toLowerCase()) {
        case "s":
          // Ctrl/Cmd + S: 파일 저장
          event.preventDefault();
          shortcuts.onSave?.();
          break;
        case "o":
          // Ctrl/Cmd + O: 파일 열기
          event.preventDefault();
          shortcuts.onOpen?.();
          break;
        case "w":
          // Ctrl/Cmd + W: 현재 탭 닫기
          event.preventDefault();
          shortcuts.onCloseTab?.();
          break;
        case "t":
          // Ctrl/Cmd + T: 새 탭 생성
          event.preventDefault();
          shortcuts.onNewTab?.();
          break;
        case "b":
          // Ctrl/Cmd + B: 사이드바 토글
          event.preventDefault();
          shortcuts.onToggleSidebar?.();
          break;
        case "f":
          // Ctrl/Cmd + F: 에디터 내 검색
          event.preventDefault();
          shortcuts.onSearch?.();
          break;
        case "h":
          // Ctrl/Cmd + H: 찾기 및 바꾸기
          event.preventDefault();
          shortcuts.onReplace?.();
          break;
        default:
          break;
      }
    },
    [shortcuts]
  );

  /**
   * 이벤트 리스너 등록 및 정리
   *
   * 생명주기 관리:
   * - 컴포넌트 마운트 시 전역 keydown 이벤트 등록
   * - 언마운트 시 이벤트 리스너 제거로 메모리 누수 방지
   * - handleKeyDown 함수 변경 시 이벤트 리스너 재등록
   *
   * 의존성 배열 최적화:
   * - handleKeyDown이 변경될 때만 useEffect 재실행
   * - shortcuts 변경 시 자동으로 새로운 핸들러 등록
   */
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // 이 훅은 부수 효과만 처리하므로 반환값 없음
  return null;
};
