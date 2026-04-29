import { useState, useEffect } from 'react';

export function useOptimisticUpdate<T>(
  initialData: T[],
  _updateFn?: (item: T) => Promise<any>
) {
  const [data, setData] = useState<T[]>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const performOptimistic = async (
    optimisticData: T[],
    mutationPromise: Promise<any>
  ) => {
    const previousData = data;
    setData(optimisticData);
    try {
      await mutationPromise;
    } catch (error) {
      setData(previousData);
      throw error;
    }
  };

  return { data, setData, performOptimistic };
}

export function useAdminShortcuts(actions: {
  onSave?: () => void;
  onCloseModals?: () => void;
  onSearch?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S: form submission
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const focused = document.activeElement;
        if (focused && focused.closest('form')) {
          e.preventDefault();
          const form = focused.closest('form');
          if (form) {
            form.requestSubmit();
          }
        } else if (actions.onSave) {
          e.preventDefault();
          actions.onSave();
        }
      }

      // Escape: close modals
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-all-modals'));
        if (actions.onCloseModals) {
          actions.onCloseModals();
        }
      }

      // Ctrl+K / Cmd+K: command palette/search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Dispatch global search event or call action
        window.dispatchEvent(new CustomEvent('toggle-search'));
        if (actions.onSearch) {
          actions.onSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
