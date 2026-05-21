import { useEffect } from 'react';

interface ShortcutHandlers {
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  clearSelection: () => void;
  copySelected: () => void;
  pasteSelected: () => void;
  duplicateSelected: () => void;
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  saveNow: () => void;
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.getAttribute('role') === 'textbox'
  );
};

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      const editingText = isEditableTarget(event.target);

      if (editingText) {
        if (ctrl && event.key.toLowerCase() === 's') {
          event.preventDefault();
          handlers.saveNow();
        }
        return;
      }

      if (ctrl && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handlers.saveNow();
      } else if (ctrl && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        handlers.redo();
      } else if (ctrl && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handlers.undo();
      } else if (ctrl && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        handlers.redo();
      } else if (ctrl && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        handlers.selectAll();
      } else if (ctrl && event.key.toLowerCase() === 'c') {
        handlers.copySelected();
      } else if (ctrl && event.key.toLowerCase() === 'v') {
        handlers.pasteSelected();
      } else if (ctrl && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        handlers.duplicateSelected();
      } else if (ctrl && event.key === '0') {
        event.preventDefault();
        handlers.fitView();
      } else if (ctrl && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        handlers.zoomIn();
      } else if (ctrl && event.key === '-') {
        event.preventDefault();
        handlers.zoomOut();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        handlers.deleteSelected();
      } else if (event.key === 'Escape') {
        handlers.clearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
};
