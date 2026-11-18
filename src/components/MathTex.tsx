import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTexProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathTex: React.FC<MathTexProps> = ({ latex, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return latex;
    }
  }, [latex, block]);

  if (block) {
    return (
      <div
        className={`overflow-x-auto py-1 text-slate-900 dark:text-[#E6EDF7] ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-middle ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
