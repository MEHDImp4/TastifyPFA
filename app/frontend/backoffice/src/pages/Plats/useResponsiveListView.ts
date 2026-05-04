import { useState, useEffect } from 'react';

export type ListMode = 'desktop' | 'mobile';

export const useResponsiveListView = (breakpoint: number = 768): ListMode => {
  const [mode, setMode] = useState<ListMode>(
    window.innerWidth >= breakpoint ? 'desktop' : 'mobile'
  );

  useEffect(() => {
    const handleResize = () => {
      setMode(window.innerWidth >= breakpoint ? 'desktop' : 'mobile');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return mode;
};
