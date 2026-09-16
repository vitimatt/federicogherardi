'use client';

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';

import { FONT_FADE_MS, waitForSiteFonts } from '@/app/lib/siteFonts';

const FontReadyContext = createContext(false);

type FontReadyProviderProps = {
  children: ReactNode;
};

export function FontReadyProvider({ children }: FontReadyProviderProps) {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (root.classList.contains('fonts-ready')) {
      setReady(true);
      return;
    }

    let fadeTimer: number | undefined;

    waitForSiteFonts().then(() => {
      root.classList.add('fonts-ready', 'fonts-fading');
      setReady(true);
      fadeTimer = window.setTimeout(() => {
        root.classList.remove('fonts-fading');
      }, FONT_FADE_MS);
    });

    return () => {
      if (fadeTimer !== undefined) {
        window.clearTimeout(fadeTimer);
      }
    };
  }, []);

  return <FontReadyContext.Provider value={ready}>{children}</FontReadyContext.Provider>;
}

export function useFontsReady() {
  return useContext(FontReadyContext);
}
