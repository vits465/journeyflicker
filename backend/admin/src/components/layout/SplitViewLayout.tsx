import React from 'react';
import { Drawer } from '../ui/Drawer';

interface SplitViewLayoutProps {
  title: string;
  actions?: React.ReactNode;
  tableContent: React.ReactNode;
  drawerContent: React.ReactNode;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  drawerTitle?: string;
  drawerActions?: React.ReactNode;
  drawerWidth?: string;
}

export function SplitViewLayout({
  title,
  actions,
  tableContent,
  drawerContent,
  isDrawerOpen,
  onCloseDrawer,
  drawerTitle = "Edit Details",
  drawerActions,
  drawerWidth = "w-[600px] max-w-[90vw]"
}: SplitViewLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-outline-variant/20 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">{title}</h1>
          <p className="text-sm text-on-surface/60 mt-1">Manage your {title.toLowerCase()}</p>
        </div>
        <div className="flex gap-3">
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0">
        {tableContent}
      </div>

      {/* Slide-out Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        title={drawerTitle}
        actions={drawerActions}
        width={drawerWidth}
      >
        {drawerContent}
      </Drawer>
      
      {/* Overlay to dim background when drawer open */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[50] transition-opacity backdrop-blur-[1px]"
          onClick={onCloseDrawer}
        />
      )}
    </div>
  );
}
