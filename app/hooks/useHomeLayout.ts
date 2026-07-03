'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

const MOBILE_BREAKPOINT = 768;
const COLUMN_WIDTH = 304;
const COLUMN_GAP = 60;
const TWO_COLUMNS_WIDTH = COLUMN_WIDTH * 2 + COLUMN_GAP;
const MAIN_HORIZONTAL_PADDING = 40;
const SITE_INFO_CLEARANCE = 20;

export type HomeLayoutMode = 'single-column' | 'two-column';

export function useHomeLayout(siteInfoRef: RefObject<HTMLElement | null>) {
  const [layoutMode, setLayoutMode] = useState<HomeLayoutMode>('single-column');
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      if (mobile) {
        setLayoutMode('single-column');
        return;
      }

      const siteInfoWidth = siteInfoRef.current?.getBoundingClientRect().width ?? 0;
      const availableWidth =
        window.innerWidth - MAIN_HORIZONTAL_PADDING - siteInfoWidth - SITE_INFO_CLEARANCE;

      setLayoutMode(availableWidth >= TWO_COLUMNS_WIDTH ? 'two-column' : 'single-column');
    };

    update();
    window.addEventListener('resize', update);

    const siteInfoElement = siteInfoRef.current;
    const resizeObserver =
      siteInfoElement && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(update)
        : null;

    resizeObserver?.observe(siteInfoElement as Element);

    return () => {
      window.removeEventListener('resize', update);
      resizeObserver?.disconnect();
    };
  }, [siteInfoRef]);

  return { layoutMode, isMobile };
}
