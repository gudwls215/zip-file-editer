import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onOpen?: () => void;
  onCloseTab?: () => void;
  onNewTab?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
  onReplace?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, key } = event;
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
      case 'w':
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
