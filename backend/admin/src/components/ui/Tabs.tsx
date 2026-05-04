import React, { useState } from 'react';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  defaultIndex?: number;
}

export function Tabs({ children, defaultIndex = 0 }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 border-b border-outline-variant/30 px-6 pt-2 bg-surface">
        {children.map((child, index) => (
          <button
            type="button"
            key={index}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeIndex === index
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
            }`}
            onClick={() => setActiveIndex(index)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {children[activeIndex]}
      </div>
    </div>
  );
}
