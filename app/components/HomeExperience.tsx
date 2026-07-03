'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { OpeningScreen } from '@/app/components/OpeningScreen';
import { ProjectList, type ProjectListItem } from '@/app/components/ProjectList';
import { SiteInfo, type SiteInformation } from '@/app/components/SiteInfo';
import { useHomeLayout } from '@/app/hooks/useHomeLayout';
import {
  dispatchProjectTransitionStart,
  flattenHideSteps,
  PROJECT_TRANSITION_BG_FADE_MS,
  saveProjectTransition,
  startProjectPageBackgroundTransition,
  type ColumnHidePlan,
} from '@/app/lib/projectTransition';
import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type OpeningImage = {
  url: string;
  width: number;
  height: number;
};

type HomeExperienceProps = {
  openingImage?: OpeningImage | null;
  projects: ProjectListItem[];
  information?: SiteInformation | null;
};

const OPENING_DISPLAY_MS = 2000;
const OPENING_FADE_MS = 500;
const PROJECT_REVEAL_INTERVAL_MS = 80;
const PROJECT_HIDE_INTERVAL_MS = 80;

type ActiveTransition = {
  slug: string;
  projectIndex: number;
  layout: RandomImageLayout;
  hideSteps: number[][];
  columns: number[][];
};

export function HomeExperience({ openingImage, projects, information }: HomeExperienceProps) {
  const router = useRouter();
  const siteInfoRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const navigateTimerRef = useRef<number | null>(null);
  const transitionRef = useRef<ActiveTransition | null>(null);
  const transitionStartRef = useRef<number>(0);
  const { layoutMode, isMobile } = useHomeLayout(siteInfoRef);
  const hasOpening = Boolean(openingImage);
  const [openingVisible, setOpeningVisible] = useState(hasOpening);
  const [openingFading, setOpeningFading] = useState(false);
  const [openingRevealPlan, setOpeningRevealPlan] = useState<ColumnHidePlan | null>(null);
  const [openingRevealStep, setOpeningRevealStep] = useState(0);
  const [openingRevealComplete, setOpeningRevealComplete] = useState(!hasOpening);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const [transitionHideStep, setTransitionHideStep] = useState(0);

  const isTransitioning = activeTransition !== null;
  const isOpeningReveal = hasOpening && !openingVisible && !openingRevealComplete && !isTransitioning;
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

  const transitionHiddenIndices = new Set(
    activeTransition ? flattenHideSteps(activeTransition.hideSteps, transitionHideStep) : [],
  );

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
    if (!openingImage) {
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      setOpeningFading(true);
    }, OPENING_DISPLAY_MS);

    const hideTimer = window.setTimeout(() => {
      setOpeningVisible(false);
    }, OPENING_DISPLAY_MS + OPENING_FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [openingImage]);

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
    return () => {
      clearTransitionTimers();
    };
  }, []);

  const handleProjectNavigate = (
    project: ProjectListItem,
    index: number,
    layout: RandomImageLayout,
    hidePlan: { hideSteps: number[][]; columns: number[][] },
  ) => {
    const slug = project.slug;

    if (!slug || isTransitioning) {
      return;
    }

    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    saveProjectTransition({
      slug,
      projectId: project._id,
      projectIndex: index,
      layout,
    });

    router.prefetch(`/projects/${slug}`);

    const { hideSteps, columns } = hidePlan;
    const transition: ActiveTransition = {
      slug,
      projectIndex: index,
      layout,
      hideSteps,
      columns,
    };

    transitionRef.current = transition;
    transitionStartRef.current = performance.now();
    startProjectPageBackgroundTransition();
    dispatchProjectTransitionStart();
    setActiveTransition(transition);
    clearTransitionTimers();
    setTransitionHideStep(0);

    if (hideSteps.length === 0) {
      scheduleNavigation(slug);
      return;
    }

    const startHideSequence = () => {
      setTransitionHideStep(1);

      if (hideSteps.length === 1) {
        scheduleNavigation(slug);
        return;
      }

      hideTimerRef.current = window.setInterval(() => {
        setTransitionHideStep((currentStep) => {
          const steps = transitionRef.current?.hideSteps ?? [];
          const nextStep = currentStep + 1;

          if (nextStep >= steps.length) {
            if (hideTimerRef.current !== null) {
              window.clearInterval(hideTimerRef.current);
              hideTimerRef.current = null;
            }

            if (transitionRef.current) {
              scheduleNavigation(transitionRef.current.slug);
            }
          }

          return nextStep;
        });
      }, PROJECT_HIDE_INTERVAL_MS);
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(startHideSequence);
    });
  };

  return (
    <>
      {openingVisible && openingImage ? (
        <OpeningScreen image={openingImage} fading={openingFading} />
      ) : null}
      <main
        className={`home-layout home-layout--${layoutMode} ${isMobile ? 'home-layout--mobile' : ''} ${isTransitioning ? 'home-layout--transitioning' : ''} relative z-10 min-h-screen bg-black p-5 ${hasOpening && openingVisible ? 'invisible' : ''}`}
      >
        <ProjectList
          projects={projects}
          isOpeningReveal={isOpeningReveal}
          openingRevealPlan={openingRevealPlan}
          openingRevealedIndices={openingRevealedIndices}
          onOpeningRevealPlanReady={handleOpeningRevealPlanReady}
          isTransitioning={isTransitioning}
          transitionHiddenIndices={transitionHiddenIndices}
          transitionColumns={activeTransition?.columns ?? null}
          transitionTargetIndex={activeTransition?.projectIndex ?? null}
          onProjectNavigate={handleProjectNavigate}
        />
        <SiteInfo
          ref={siteInfoRef}
          information={information}
          isMobile={isMobile}
          className={transitionHideStep > 0 ? 'site-info--transition-hidden' : undefined}
        />
      </main>
    </>
  );
}
