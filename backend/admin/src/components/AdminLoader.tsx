import React from 'react';

export const AdminLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin"></div>
        <p className="text-gray-400 animate-pulse font-medium text-xs uppercase tracking-widest">Synchronizing Intelligence...</p>
      </div>
    </div>
  );
};
