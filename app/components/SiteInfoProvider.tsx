'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from 'react';

import { SiteInfo, type SiteInformation } from '@/app/components/SiteInfo';
import { useHomeLayout, type HomeLayoutMode } from '@/app/hooks/useHomeLayout';

type SiteInfoContextValue = {
  siteInfoRef: RefObject<HTMLDivElement | null>;
  layoutMode: HomeLayoutMode;
  isMobile: boolean;
  setTransitionHidden: Dispatch<SetStateAction<boolean>>;
};

const SiteInfoContext = createContext<SiteInfoContextValue | null>(null);

type SiteInfoProviderProps = {
  information?: SiteInformation | null;
  children: ReactNode;
};

export function SiteInfoProvider({ information, children }: SiteInfoProviderProps) {
  const siteInfoRef = useRef<HTMLDivElement>(null);
  const [transitionHidden, setTransitionHidden] = useState(false);
  const { layoutMode, isMobile } = useHomeLayout(siteInfoRef);

  return (
    <SiteInfoContext.Provider
      value={{ siteInfoRef, layoutMode, isMobile, setTransitionHidden }}
    >
      <SiteInfo
        ref={siteInfoRef}
        information={information}
        isMobile={isMobile}
        className={transitionHidden ? 'site-info--transition-hidden' : undefined}
      />
      {children}
    </SiteInfoContext.Provider>
  );
}

export function useSiteInfo() {
  const context = useContext(SiteInfoContext);

  if (!context) {
    throw new Error('useSiteInfo must be used within SiteInfoProvider');
  }

  return context;
}
