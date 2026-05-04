import React, { useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  actions?: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children, width = 'w-[500px]', actions }: DrawerProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div 
      className={`fixed inset-y-0 right-0 z-[60] bg-white dark:bg-[#121212] border-l border-outline-variant/20 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${width} max-w-[100vw] ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface">
        <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-on-surface/60 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 admin-scroll relative bg-background/30 dark:bg-background/10">
        {children}
      </div>
    </div>
  );
}
