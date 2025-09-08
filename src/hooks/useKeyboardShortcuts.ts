import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onOpen?: () => void;
  onCloseTab?: () => void;
  onNewTab?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onReplace?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRestoreRecentlyClosedTab?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, key } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    if (!isCtrlOrCmd) return;

    switch (key.toLowerCase()) {
      case 's':
        event.preventDefault();
        shortcuts.onSave?.();
        break;
      case 'o':
        event.preventDefault();
        shortcuts.onOpen?.();
        break;
      case 'q':
        event.preventDefault();
        shortcuts.onCloseTab?.();
        break;
      case 't':
        event.preventDefault();
        shortcuts.onNewTab?.();
        break;
      case 'b':
        event.preventDefault();
        shortcuts.onToggleSidebar?.();
        break;
      case 'f':
        event.preventDefault();
        shortcuts.onSearch?.();
        break;
      case 'h':
        event.preventDefault();
        shortcuts.onReplace?.();
        break;
      case 'z':
        event.preventDefault();
        shortcuts.onUndo?.();
        break;
      case 'y':
        event.preventDefault();
        shortcuts.onRedo?.();
        break;
      
      case 'r':
        if (shiftKey) {
          // Ctrl+Shift+R: 최근 닫힌 탭 복구
          event.preventDefault();
          shortcuts.onRestoreRecentlyClosedTab?.();
        }
        break;
      default:
        break;
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
};
