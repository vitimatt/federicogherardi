'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ProjectList, type ProjectListItem } from '@/app/components/ProjectList';
import { ProjectPageImage } from '@/app/components/ProjectPageImage';
import { useHomeLayout } from '@/app/hooks/useHomeLayout';
import { formatProjectMeta } from '@/app/lib/formatProjectMeta';
import {
  buildProjectPageImageLayouts,
  getProjectPageCanvasHeight,
} from '@/app/lib/projectPageImageLayout';
import {
  buildColumnHidePlan,
  clearProjectTransition,
  dispatchProjectTransitionEnd,
  dispatchProjectTransitionStart,
  flattenHideSteps,
  PROJECT_TRANSITION_BG_FADE_MS,
  readProjectTransition,
  saveProjectTransition,
  setProjectPageBackground,
  startProjectPageBackgroundTransition,
  type ColumnHidePlan,
} from '@/app/lib/projectTransition';
import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type ProjectImage = {
  url: string;
  width: number;
  height: number;
};

type Project = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  client: string;
  images: ProjectImage[];
};

type ProjectPageExperienceProps = {
  project: Project;
  projects: ProjectListItem[];
};

const PROJECT_PAGE_MOUNT_FADE_MS = 800;
const PROJECT_PAGE_MOUNT_STAGGER_MS = 50;
const PROJECT_PAGE_MOUNT_LEAD_MS = 250;
const SCROLL_BOTTOM_THRESHOLD_PX = 1;
const LIST_REVEAL_INTERVAL_MS = 80;
const LIST_HIDE_INTERVAL_MS = 80;
const PROJECT_NAVIGATE_HIDE_INTERVAL_MS = 80;
const SCROLL_TO_TOP_MS = 1200;

type ActiveTransition = {
  slug: string;
  projectIndex: number;
  layout: RandomImageLayout;
  hideSteps: number[][];
  columns: number[][];
};

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function ProjectPageExperience({ project, projects }: ProjectPageExperienceProps) {
  const router = useRouter();
  const pageRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const listOverlayRef = useRef(false);
  const isListClosingRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const overlayCloseTimerRef = useRef<number | null>(null);
  const scrollToTopFrameRef = useRef<number | null>(null);
  const transitionRef = useRef<ActiveTransition | null>(null);
  const transitionStartRef = useRef<number>(0);
  const transitionHideTimerRef = useRef<number | null>(null);
  const navigateTimerRef = useRef<number | null>(null);
  const [fromTransition, setFromTransition] =
    useState<ReturnType<typeof readProjectTransition>>(null);
  const [layouts, setLayouts] = useState<ReturnType<typeof buildProjectPageImageLayouts> | null>(
    null,
  );
  const [bridgeHandoffComplete, setBridgeHandoffComplete] = useState(true);
  const [imageHandoffFixed, setImageHandoffFixed] = useState(false);
  const [secondaryMounting, setSecondaryMounting] = useState(true);
  const [listOverlayActive, setListOverlayActive] = useState(false);
  const [listOverlayFading, setListOverlayFading] = useState(false);
  const [listRevealPlan, setListRevealPlan] = useState<ColumnHidePlan | null>(null);
  const [listRevealStep, setListRevealStep] = useState(0);
  const [listRevealComplete, setListRevealComplete] = useState(false);
  const [listHiding, setListHiding] = useState(false);
  const [listHidePlan, setListHidePlan] = useState<ColumnHidePlan | null>(null);
  const [listHideStep, setListHideStep] = useState(0);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const [transitionHideStep, setTransitionHideStep] = useState(0);
  const { layoutMode, isMobile } = useHomeLayout(layoutRef);

  useLayoutEffect(() => {
    const transition = readProjectTransition(project.slug);
    setFromTransition(transition);
    setLayouts(buildProjectPageImageLayouts(project.images, transition?.layout ?? null));
    setBridgeHandoffComplete(!transition);
    setSecondaryMounting(!transition);
  }, [project.images, project.slug]);

  const canvasHeight = useMemo(
    () => (layouts ? getProjectPageCanvasHeight(layouts) : null),
    [layouts],
  );
  const isListRevealActive = listOverlayActive && !listRevealComplete && !listHiding;
  const listRevealedIndices = useMemo(
    () =>
      listRevealPlan ? new Set(flattenHideSteps(listRevealPlan.hideSteps, listRevealStep)) : null,
    [listRevealPlan, listRevealStep],
  );
  const listHideHiddenIndices = useMemo(
    () =>
      listHidePlan ? new Set(flattenHideSteps(listHidePlan.hideSteps, listHideStep)) : new Set<number>(),
    [listHidePlan, listHideStep],
  );
  const isListHideComplete =
    listHiding && listHidePlan !== null && listHideStep >= listHidePlan.hideSteps.length;
  const isProjectNavigating = activeTransition !== null;
  const showProjectMeta = !listOverlayActive || isListHideComplete;
  const projectMetaClassName = `project-page__meta${showProjectMeta ? '' : ' project-page__meta--hidden'}`;
  const transitionHiddenIndices = useMemo(
    () =>
      activeTransition
        ? new Set(flattenHideSteps(activeTransition.hideSteps, transitionHideStep))
        : listHideHiddenIndices,
    [activeTransition, listHideHiddenIndices, transitionHideStep],
  );

  const handleListRevealPlanReady = useCallback((plan: ColumnHidePlan) => {
    setListRevealPlan((currentPlan) => currentPlan ?? plan);
  }, []);

  const clearListRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const clearListHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearInterval(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const resetListReveal = useCallback(() => {
    clearListRevealTimer();
    clearListHideTimer();
    setListRevealPlan(null);
    setListRevealStep(0);
    setListRevealComplete(false);
    setListHiding(false);
    setListHidePlan(null);
    setListHideStep(0);
  }, [clearListHideTimer, clearListRevealTimer]);

  const clearBackgroundFadeDuration = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.style.removeProperty('--project-bg-fade-ms');
  }, []);

  const beginBackgroundFadeToWhite = useCallback((durationMs: number) => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.style.setProperty('--project-bg-fade-ms', `${durationMs}ms`);
    setListOverlayFading(false);
  }, []);

  const finishCloseListOverlay = useCallback(() => {
    isListClosingRef.current = false;
    listOverlayRef.current = false;
    clearListHideTimer();

    if (overlayCloseTimerRef.current !== null) {
      window.clearTimeout(overlayCloseTimerRef.current);
      overlayCloseTimerRef.current = null;
    }

    setListOverlayActive(false);
    setListOverlayFading(false);
    resetListReveal();
    clearBackgroundFadeDuration();
  }, [clearBackgroundFadeDuration, clearListHideTimer, resetListReveal]);

  const scheduleFinishClose = useCallback(
    (hideSteps: number[][]) => {
      if (overlayCloseTimerRef.current !== null) {
        window.clearTimeout(overlayCloseTimerRef.current);
      }

      const hideDuration =
        hideSteps.length <= 1 ? 0 : (hideSteps.length - 1) * LIST_HIDE_INTERVAL_MS;
      const totalCloseMs = Math.max(hideDuration, PROJECT_TRANSITION_BG_FADE_MS);

      overlayCloseTimerRef.current = window.setTimeout(() => {
        finishCloseListOverlay();
      }, totalCloseMs);
    },
    [finishCloseListOverlay],
  );

  const openListOverlay = useCallback(() => {
    if (listOverlayRef.current) {
      return;
    }

    if (overlayCloseTimerRef.current !== null) {
      window.clearTimeout(overlayCloseTimerRef.current);
      overlayCloseTimerRef.current = null;
    }

    listOverlayRef.current = true;
    isListClosingRef.current = false;
    resetListReveal();
    setListOverlayActive(true);
    setListOverlayFading(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setListOverlayFading(true);
      });
    });
  }, [resetListReveal]);

  const startCloseListOverlay = useCallback(
    (options?: { skipBackgroundFade?: boolean }) => {
      if (isListClosingRef.current || !listOverlayRef.current) {
        return;
      }

      isListClosingRef.current = true;
      clearListRevealTimer();
      setListHiding(true);

      if (!options?.skipBackgroundFade) {
        beginBackgroundFadeToWhite(PROJECT_TRANSITION_BG_FADE_MS);
      }

      const listItems = layoutRef.current?.querySelectorAll<HTMLElement>('.project-item');
    const hidePlan = buildColumnHidePlan(Array.from(listItems ?? []), -1);
    const { hideSteps } = hidePlan;

    setListHidePlan(hidePlan);
    setListHideStep(0);

    if (hideSteps.length === 0) {
      scheduleFinishClose(hideSteps);
      return;
    }

    window.requestAnimationFrame(() => {
      setListHideStep(1);

      if (hideSteps.length === 1) {
        scheduleFinishClose(hideSteps);
        return;
      }

      hideTimerRef.current = window.setInterval(() => {
        setListHideStep((currentStep) => {
          const nextStep = currentStep + 1;

          if (nextStep >= hideSteps.length) {
            clearListHideTimer();
          }

          return nextStep;
        });
      }, LIST_HIDE_INTERVAL_MS);

      scheduleFinishClose(hideSteps);
    });
    },
    [beginBackgroundFadeToWhite, clearListRevealTimer, clearListHideTimer, scheduleFinishClose],
  );

  const cancelScrollToTop = useCallback(() => {
    if (scrollToTopFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollToTopFrameRef.current);
      scrollToTopFrameRef.current = null;
    }
  }, []);

  const scrollPageToTop = useCallback(
    (onComplete?: () => void) => {
      const page = pageRef.current;

      if (!page) {
        onComplete?.();
        return;
      }

      cancelScrollToTop();

      const startTop = page.scrollTop;

      if (startTop <= 0) {
        page.scrollTop = 0;
        onComplete?.();
        return;
      }

      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / SCROLL_TO_TOP_MS, 1);
        const eased = easeInOutCubic(progress);
        page.scrollTop = startTop * (1 - eased);

        if (progress < 1) {
          scrollToTopFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        page.scrollTop = 0;
        scrollToTopFrameRef.current = null;
        onComplete?.();
      };

      scrollToTopFrameRef.current = window.requestAnimationFrame(step);
    },
    [cancelScrollToTop],
  );

  const handleCurrentProjectClick = useCallback(() => {
    if (!listOverlayRef.current || isProjectNavigating) {
      return;
    }

    const page = pageRef.current;
    const fadeMs =
      page && page.scrollTop > 0 ? SCROLL_TO_TOP_MS : PROJECT_TRANSITION_BG_FADE_MS;

    beginBackgroundFadeToWhite(fadeMs);
    scrollPageToTop();

    if (!isListClosingRef.current) {
      startCloseListOverlay({ skipBackgroundFade: true });
    }
  }, [
    beginBackgroundFadeToWhite,
    isProjectNavigating,
    scrollPageToTop,
    startCloseListOverlay,
  ]);

  const clearProjectNavigateTimers = useCallback(() => {
    if (transitionHideTimerRef.current !== null) {
      window.clearInterval(transitionHideTimerRef.current);
      transitionHideTimerRef.current = null;
    }

    if (navigateTimerRef.current !== null) {
      window.clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = null;
    }
  }, []);

  const scheduleProjectNavigation = useCallback(
    (slug: string) => {
      const elapsed = performance.now() - transitionStartRef.current;
      const delay = Math.max(PROJECT_TRANSITION_BG_FADE_MS - elapsed, 0);

      navigateTimerRef.current = window.setTimeout(() => {
        router.push(`/projects/${slug}`);
      }, delay);
    },
    [router],
  );

  const handleProjectNavigate = useCallback(
    (
      targetProject: ProjectListItem,
      index: number,
      layout: RandomImageLayout,
      hidePlan: ColumnHidePlan,
    ) => {
      const slug = targetProject.slug;

      if (!slug || isProjectNavigating || listHiding || !listOverlayRef.current) {
        return;
      }

      clearListRevealTimer();
      clearProjectNavigateTimers();

      saveProjectTransition({
        slug,
        projectId: targetProject._id,
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
      setListOverlayFading(false);
      setActiveTransition(transition);
      setTransitionHideStep(0);

      if (hideSteps.length === 0) {
        scheduleProjectNavigation(slug);
        return;
      }

      const startHideSequence = () => {
        setTransitionHideStep(1);

        if (hideSteps.length === 1) {
          scheduleProjectNavigation(slug);
          return;
        }

        transitionHideTimerRef.current = window.setInterval(() => {
          setTransitionHideStep((currentStep) => {
            const steps = transitionRef.current?.hideSteps ?? [];
            const nextStep = currentStep + 1;

            if (nextStep >= steps.length) {
              if (transitionHideTimerRef.current !== null) {
                window.clearInterval(transitionHideTimerRef.current);
                transitionHideTimerRef.current = null;
              }

              if (transitionRef.current) {
                scheduleProjectNavigation(transitionRef.current.slug);
              }
            }

            return nextStep;
          });
        }, PROJECT_NAVIGATE_HIDE_INTERVAL_MS);
      };

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(startHideSequence);
      });
    },
    [
      clearListRevealTimer,
      clearProjectNavigateTimers,
      isProjectNavigating,
      listHiding,
      router,
      scheduleProjectNavigation,
    ],
  );

  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const className = 'body--project-page-list-black';

    if (listOverlayFading) {
      document.documentElement.classList.add(className);
      document.body.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    }

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [listOverlayFading]);

  useLayoutEffect(() => {
    if (!fromTransition || !pageRef.current) {
      return;
    }

    pageRef.current.scrollTop = 0;
  }, [fromTransition, project.slug]);

  useLayoutEffect(() => {
    if (!fromTransition || !layouts || secondaryMounting) {
      return;
    }

    setSecondaryMounting(true);
  }, [fromTransition, layouts, secondaryMounting]);

  useLayoutEffect(() => {
    if (!fromTransition || !layouts || !secondaryMounting || bridgeHandoffComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBridgeHandoffComplete(true);
      setImageHandoffFixed(true);
    }, PROJECT_PAGE_MOUNT_LEAD_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fromTransition, layouts, secondaryMounting, bridgeHandoffComplete]);

  useLayoutEffect(() => {
    if (!imageHandoffFixed) {
      return;
    }

    pageRef.current?.scrollTo(0, 0);

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        clearProjectTransition();
        dispatchProjectTransitionEnd();
        setImageHandoffFixed(false);
        setProjectPageBackground(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [imageHandoffFixed]);

  useLayoutEffect(() => {
    if (!listRevealPlan || !isListRevealActive) {
      return;
    }

    if (listRevealPlan.hideSteps.length === 0) {
      setListRevealComplete(true);
      return;
    }

    setListRevealStep(1);
  }, [isListRevealActive, listRevealPlan]);

  useEffect(() => {
    if (!listRevealPlan || !isListRevealActive) {
      return;
    }

    const { hideSteps } = listRevealPlan;

    if (hideSteps.length <= 1) {
      if (hideSteps.length === 1) {
        setListRevealComplete(true);
      }
      return;
    }

    revealTimerRef.current = window.setInterval(() => {
      setListRevealStep((currentStep) => {
        const nextStep = currentStep + 1;

        if (nextStep >= hideSteps.length) {
          clearListRevealTimer();
          setListRevealComplete(true);
        }

        return nextStep;
      });
    }, LIST_REVEAL_INTERVAL_MS);

    return () => {
      clearListRevealTimer();
    };
  }, [clearListRevealTimer, isListRevealActive, listRevealPlan]);

  const scrollPageBy = useCallback((deltaY: number) => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    page.scrollTop = Math.max(0, page.scrollTop + deltaY);
  }, []);

  const handleOverlayScrollUp = useCallback(
    (deltaY: number) => {
      if (deltaY >= 0 || !listOverlayRef.current || isProjectNavigating) {
        return false;
      }

      if (!isListClosingRef.current) {
        startCloseListOverlay();
      }

      scrollPageBy(deltaY);
      return true;
    },
    [isProjectNavigating, scrollPageBy, startCloseListOverlay],
  );
  const isAtBottom = useCallback(() => {
    const page = pageRef.current;

    if (!page) {
      return false;
    }

    const maxScrollTop = Math.max(0, page.scrollHeight - page.clientHeight);

    if (maxScrollTop <= SCROLL_BOTTOM_THRESHOLD_PX) {
      return true;
    }

    return page.scrollTop >= maxScrollTop - SCROLL_BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    let lastTouchY = 0;

    const handleWheel = (event: WheelEvent) => {
      if (listOverlayRef.current) {
        if (handleOverlayScrollUp(event.deltaY)) {
          event.preventDefault();
        }
        return;
      }

      if (event.deltaY <= 0 || !isAtBottom()) {
        return;
      }

      event.preventDefault();
      openListOverlay();
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? lastTouchY;
      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;

      if (listOverlayRef.current) {
        if (deltaY >= 0) {
          return;
        }

        handleOverlayScrollUp(deltaY);
        event.preventDefault();
        return;
      }

      if (deltaY <= 0 || !isAtBottom()) {
        return;
      }

      event.preventDefault();
      openListOverlay();
    };

    page.addEventListener('wheel', handleWheel, { passive: false });
    page.addEventListener('touchstart', handleTouchStart, { passive: true });
    page.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      page.removeEventListener('wheel', handleWheel);
      page.removeEventListener('touchstart', handleTouchStart);
      page.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleOverlayScrollUp, isAtBottom, openListOverlay]);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay || !listOverlayActive) {
      return;
    }

    let lastTouchY = 0;

    const handleWheel = (event: WheelEvent) => {
      if (handleOverlayScrollUp(event.deltaY)) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? lastTouchY;
      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;

      if (deltaY >= 0) {
        return;
      }

      handleOverlayScrollUp(deltaY);
      event.preventDefault();
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
    overlay.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      overlay.removeEventListener('wheel', handleWheel);
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleOverlayScrollUp, listOverlayActive]);

  useEffect(() => {
    return () => {
      clearListRevealTimer();
      clearListHideTimer();
      clearProjectNavigateTimers();
      cancelScrollToTop();
      clearBackgroundFadeDuration();

      if (overlayCloseTimerRef.current !== null) {
        window.clearTimeout(overlayCloseTimerRef.current);
      }
    };
  }, [
    cancelScrollToTop,
    clearBackgroundFadeDuration,
    clearListHideTimer,
    clearListRevealTimer,
    clearProjectNavigateTimers,
  ]);

  return (
    <main
      ref={pageRef}
      className={`project-page${listOverlayActive ? ' project-page--list-overlay-active' : ''}${listOverlayFading ? ' project-page--list-overlay-visible' : ''}${listHiding ? ' project-page--list-overlay-closing' : ''}${isProjectNavigating ? ' project-page--navigating' : ''}`}
    >
      {layouts ? (
        <div className="project-page__canvas" style={{ height: `${canvasHeight}px` }}>
          <header className={projectMetaClassName}>
            <span className="project-page__indicator text-secondary">
              {formatProjectMeta(project.category, project.images.length)}
            </span>
            <span className="project-page__title text-primary">
              {project.title} — {project.client}
            </span>
          </header>
          {layouts.map((layout, index) => {
            if (fromTransition && index === 0 && !bridgeHandoffComplete) {
              return null;
            }

            if (fromTransition && index > 0 && !secondaryMounting) {
              return null;
            }

            return (
              <ProjectPageImage
                key={layout.image.url}
                layout={layout}
                caption={String(index + 1).padStart(2, '0')}
                skipMountFade={Boolean(fromTransition && index === 0)}
                positionFixed={Boolean(fromTransition && index === 0 && imageHandoffFixed)}
                mountDelayMs={index > 0 ? (index - 1) * PROJECT_PAGE_MOUNT_STAGGER_MS : 0}
                mountFadeMs={PROJECT_PAGE_MOUNT_FADE_MS}
              />
            );
          })}
        </div>
      ) : (
        <div className="project-page__canvas">
          <header className={projectMetaClassName}>
            <span className="project-page__indicator text-secondary">
              {formatProjectMeta(project.category, project.images.length)}
            </span>
            <span className="project-page__title text-primary">
              {project.title} — {project.client}
            </span>
          </header>
        </div>
      )}
      {listOverlayActive ? (
        <div
          ref={overlayRef}
          className={`project-page__list-overlay${listOverlayFading ? ' project-page__list-overlay--visible' : ''}${listHiding ? ' project-page__list-overlay--closing' : ''}`}
        >
          <div
            ref={layoutRef}
            className={`project-page__list-layout project-page__list-layout--${layoutMode} ${isMobile ? 'project-page__list-layout--mobile' : ''}`}
          >
            <ProjectList
              projects={projects}
              isOpeningReveal={isListRevealActive}
              openingRevealPlan={listRevealPlan}
              openingRevealedIndices={listRevealedIndices}
              onOpeningRevealPlanReady={handleListRevealPlanReady}
              isTransitioning={listHiding || isProjectNavigating}
              transitionHiddenIndices={transitionHiddenIndices}
              transitionColumns={
                activeTransition?.columns ?? listHidePlan?.columns ?? listRevealPlan?.columns ?? null
              }
              transitionTargetIndex={activeTransition?.projectIndex ?? null}
              onProjectNavigate={handleProjectNavigate}
              currentProjectSlug={project.slug}
              onCurrentProjectClick={handleCurrentProjectClick}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
