'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useFontsReady } from '@/app/components/FontReadyProvider';
import { OpeningScreen } from '@/app/components/OpeningScreen';
import { ProjectList, type ProjectListItem } from '@/app/components/ProjectList';
import { SiteInfo } from '@/app/components/SiteInfo';
import { useSiteInfo } from '@/app/components/SiteInfoProvider';
import {
  buildSequentialRevealSteps,
  clearHomeBackgroundTransition,
  dispatchProjectTransitionStart,
  flattenHideSteps,
  isHomeBackgroundTransitionActive,
  PROJECT_TRANSITION_BG_FADE_MS,
  startProjectPageBackgroundTransition,
  type ColumnHidePlan,
} from '@/app/lib/projectTransition';
import { getSiteInfoInlineSectionCount } from '@/app/lib/siteInformation';
import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type OpeningImage = {
  url: string;
  width: number;
  height: number;
};

type HomeExperienceProps = {
  openingImage?: OpeningImage | null;
  projects: ProjectListItem[];
};

const OPENING_DISPLAY_MS = 2000;
const OPENING_FADE_MS = 500;
const PROJECT_REVEAL_INTERVAL_MS = 80;

type ActiveTransition = {
  slug: string;
  projectIndex: number;
  layout: RandomImageLayout;
  hideSteps: number[][];
  columns: number[][];
};

export function HomeExperience({ openingImage, projects }: HomeExperienceProps) {
  const router = useRouter();
  const revealTimerRef = useRef<number | null>(null);
  const siteInfoRevealTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const navigateTimerRef = useRef<number | null>(null);
  const transitionStartRef = useRef<number>(0);
  const { layoutMode, isMobile, information, setTransitionHidden } = useSiteInfo();
  const fontsReady = useFontsReady();
  const hasOpening = Boolean(openingImage);
  const [fromHomeTransition, setFromHomeTransition] = useState(false);
  const [openingVisible, setOpeningVisible] = useState(hasOpening);
  const [openingFading, setOpeningFading] = useState(false);
  const [openingDisplayElapsed, setOpeningDisplayElapsed] = useState(!hasOpening);
  const [openingRevealPlan, setOpeningRevealPlan] = useState<ColumnHidePlan | null>(null);
  const [openingRevealStep, setOpeningRevealStep] = useState(0);
  const [openingRevealComplete, setOpeningRevealComplete] = useState(!hasOpening);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const [siteInfoRevealStep, setSiteInfoRevealStep] = useState(0);
  const [siteInfoRevealComplete, setSiteInfoRevealComplete] = useState(!hasOpening);

  const isTransitioning = activeTransition !== null;
  const playHomeReveal = hasOpening || fromHomeTransition;
  const siteInfoSectionCount = useMemo(
    () => (isMobile ? getSiteInfoInlineSectionCount(information) : 0),
    [information, isMobile],
  );
  const hideMain = !fontsReady || (hasOpening && openingVisible && !fromHomeTransition);
  const isOpeningReveal =
    playHomeReveal && !openingVisible && !openingRevealComplete && !isTransitioning && fontsReady;
  const openingRevealedIndices = useMemo(
    () =>
      openingRevealPlan
        ? new Set(flattenHideSteps(openingRevealPlan.hideSteps, openingRevealStep))
        : null,
    [openingRevealPlan, openingRevealStep],
  );

  const handleOpeningRevealPlanReady = useCallback((plan: ColumnHidePlan) => {
    setOpeningRevealPlan((currentPlan) => currentPlan ?? plan);
  }, []);

  const siteInfoStaggerRevealedIndices = useMemo(() => {
    if (!isMobile || isTransitioning) {
      return null;
    }

    if (isOpeningReveal) {
      return new Set<number>();
    }

    if (siteInfoRevealComplete) {
      return null;
    }

    return new Set(
      flattenHideSteps(buildSequentialRevealSteps(siteInfoSectionCount), siteInfoRevealStep),
    );
  }, [
    isMobile,
    isOpeningReveal,
    isTransitioning,
    siteInfoRevealComplete,
    siteInfoRevealStep,
    siteInfoSectionCount,
  ]);

  useLayoutEffect(() => {
    if (!isHomeBackgroundTransitionActive()) {
      return;
    }

    setFromHomeTransition(true);
    setOpeningVisible(false);
    setOpeningFading(false);
    setOpeningDisplayElapsed(true);
    setOpeningRevealPlan(null);
    setOpeningRevealStep(0);
    setOpeningRevealComplete(false);
    setSiteInfoRevealStep(0);
    setSiteInfoRevealComplete(false);
    setActiveTransition(null);
  }, []);

  useLayoutEffect(() => {
    if (!fromHomeTransition) {
      return;
    }

    if (!fontsReady) {
      return;
    }

    if (!openingRevealComplete && openingRevealStep < 1) {
      return;
    }

    clearHomeBackgroundTransition();
    setTransitionHidden(false);
  }, [
    fontsReady,
    fromHomeTransition,
    openingRevealComplete,
    openingRevealStep,
    setTransitionHidden,
  ]);

  useEffect(() => {
    if (fromHomeTransition) {
      setTransitionHidden(true);
      return;
    }

    setTransitionHidden(isTransitioning);

    return () => {
      setTransitionHidden(false);
    };
  }, [fromHomeTransition, isTransitioning, setTransitionHidden]);

  const clearSiteInfoRevealTimer = () => {
    if (siteInfoRevealTimerRef.current !== null) {
      window.clearInterval(siteInfoRevealTimerRef.current);
      siteInfoRevealTimerRef.current = null;
    }
  };

  const clearTransitionTimers = () => {
    if (hideTimerRef.current !== null) {
      window.clearInterval(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (navigateTimerRef.current !== null) {
      window.clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = null;
    }
  };

  const scheduleNavigation = (slug: string) => {
    const elapsed = performance.now() - transitionStartRef.current;
    const delay = Math.max(PROJECT_TRANSITION_BG_FADE_MS - elapsed, 0);

    navigateTimerRef.current = window.setTimeout(() => {
      router.push(`/projects/${slug}`);
    }, delay);
  };

  useEffect(() => {
    if (!openingImage || fromHomeTransition) {
      return;
    }

    const displayTimer = window.setTimeout(() => {
      setOpeningDisplayElapsed(true);
    }, OPENING_DISPLAY_MS);

    return () => {
      window.clearTimeout(displayTimer);
    };
  }, [fromHomeTransition, openingImage]);

  useEffect(() => {
    if (!openingImage || fromHomeTransition || !openingDisplayElapsed || !fontsReady || openingFading) {
      return;
    }

    setOpeningFading(true);
  }, [fontsReady, fromHomeTransition, openingDisplayElapsed, openingFading, openingImage]);

  useEffect(() => {
    if (!openingFading || fromHomeTransition) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setOpeningVisible(false);
    }, OPENING_FADE_MS);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [openingFading, fromHomeTransition]);

  useLayoutEffect(() => {
    if (!openingRevealPlan || !isOpeningReveal) {
      return;
    }

    if (openingRevealPlan.hideSteps.length === 0) {
      setOpeningRevealComplete(true);
      return;
    }

    setOpeningRevealStep(1);
  }, [openingRevealPlan, isOpeningReveal]);

  useEffect(() => {
    if (!openingRevealPlan || !isOpeningReveal) {
      return;
    }

    const { hideSteps } = openingRevealPlan;

    if (hideSteps.length <= 1) {
      if (hideSteps.length === 1) {
        setOpeningRevealComplete(true);
      }
      return;
    }

    revealTimerRef.current = window.setInterval(() => {
      setOpeningRevealStep((currentStep) => {
        const nextStep = currentStep + 1;

        if (nextStep >= hideSteps.length) {
          if (revealTimerRef.current !== null) {
            window.clearInterval(revealTimerRef.current);
            revealTimerRef.current = null;
          }

          setOpeningRevealComplete(true);
        }

        return nextStep;
      });
    }, PROJECT_REVEAL_INTERVAL_MS);

    return () => {
      if (revealTimerRef.current !== null) {
        window.clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [openingRevealPlan, isOpeningReveal]);

  useEffect(() => {
    if (!fontsReady || !isMobile || isTransitioning) {
      return;
    }

    if (!openingRevealComplete || siteInfoRevealComplete) {
      return;
    }

    if (siteInfoSectionCount <= 1) {
      setSiteInfoRevealComplete(true);
      return;
    }

    setSiteInfoRevealStep(1);

    siteInfoRevealTimerRef.current = window.setInterval(() => {
      setSiteInfoRevealStep((currentStep) => {
        const nextStep = currentStep + 1;

        if (nextStep >= siteInfoSectionCount) {
          clearSiteInfoRevealTimer();
          setSiteInfoRevealComplete(true);
        }

        return nextStep;
      });
    }, PROJECT_REVEAL_INTERVAL_MS);

    return () => {
      clearSiteInfoRevealTimer();
    };
  }, [
    fontsReady,
    isMobile,
    isTransitioning,
    openingRevealComplete,
    siteInfoRevealComplete,
    siteInfoSectionCount,
  ]);

  useEffect(() => {
    return () => {
      clearSiteInfoRevealTimer();
      clearTransitionTimers();
    };
  }, []);

  const handleProjectNavigate = (
    project: ProjectListItem,
    _index: number,
    _layout: RandomImageLayout,
    _hidePlan: { hideSteps: number[][]; columns: number[][] },
  ) => {
    const slug = project.slug;

    if (!slug || isTransitioning) {
      return;
    }

    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    router.prefetch(`/projects/${slug}`);
    transitionStartRef.current = performance.now();
    startProjectPageBackgroundTransition();
    dispatchProjectTransitionStart();
    setActiveTransition({
      slug,
      projectIndex: _index,
      layout: _layout,
      hideSteps: [],
      columns: [],
    });
    clearTransitionTimers();
    clearSiteInfoRevealTimer();
    scheduleNavigation(slug);
  };

  return (
    <>
      {openingVisible && openingImage ? (
        <OpeningScreen image={openingImage} fading={openingFading} />
      ) : null}
      <main
        className={`home-layout home-layout--${layoutMode} ${isMobile ? 'home-layout--mobile py-5 px-0' : 'p-5'} ${isTransitioning ? 'home-layout--transitioning' : ''} relative z-10 min-h-screen bg-black ${hideMain ? 'invisible' : ''}`}
      >
        <div className="home-layout__projects">
          <ProjectList
            projects={projects}
            isOpeningReveal={isOpeningReveal}
            openingRevealPlan={openingRevealPlan}
            openingRevealedIndices={openingRevealedIndices}
            onOpeningRevealPlanReady={handleOpeningRevealPlanReady}
            isTransitioning={isTransitioning}
            dismissHoverImages={isTransitioning}
            transitionHiddenIndices={undefined}
            transitionColumns={null}
            transitionTargetIndex={null}
            onProjectNavigate={handleProjectNavigate}
            isMobile={isMobile}
          />
          {isMobile ? (
            <SiteInfo
              information={information}
              isMobile
              placement="inline"
              staggerRevealedIndices={siteInfoStaggerRevealedIndices}
              staggerHiddenIndices={null}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
