'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ProjectImageSlider } from '@/app/components/ProjectImageSlider';
import { ProjectList, type ProjectListItem, PROJECT_HOVER_FADE_OUT_MS } from '@/app/components/ProjectList';
import { ProjectPageImage } from '@/app/components/ProjectPageImage';
import { SiteInfo } from '@/app/components/SiteInfo';
import { useFontsReady } from '@/app/components/FontReadyProvider';
import { useSiteInfo } from '@/app/components/SiteInfoProvider';
import { formatProjectMeta } from '@/app/lib/formatProjectMeta';
import {
  buildProjectPageImageLayouts,
  getProjectPageCanvasHeight,
} from '@/app/lib/projectPageImageLayout';
import {
  buildColumnHidePlan,
  buildSequentialRevealSteps,
  clearProjectTransition,
  dispatchProjectTransitionEnd,
  dispatchProjectTransitionStart,
  flattenHideSteps,
  getProjectHideStepForCombinedStep,
  getSiteInfoTransitionHiddenIndices,
  PROJECT_TRANSITION_BG_FADE_MS,
  setProjectPageBackground,
  startHomeBackgroundTransition,
  startProjectPageBackgroundTransition,
  type ColumnHidePlan,
} from '@/app/lib/projectTransition';
import { getSiteInfoInlineSectionCount } from '@/app/lib/siteInformation';
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
const SCROLL_BOTTOM_THRESHOLD_PX = 1;
const LIST_REVEAL_INTERVAL_MS = 80;
const LIST_HIDE_INTERVAL_MS = 80;
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
  const siteInfoRevealTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const overlayCloseTimerRef = useRef<number | null>(null);
  const scrollToTopFrameRef = useRef<number | null>(null);
  const transitionRef = useRef<ActiveTransition | null>(null);
  const transitionStartRef = useRef<number>(0);
  const transitionHideTimerRef = useRef<number | null>(null);
  const navigateTimerRef = useRef<number | null>(null);
  const homeNavigateTimerRef = useRef<number | null>(null);
  const isHomeNavigatingRef = useRef(false);
  const [layouts, setLayouts] = useState<ReturnType<typeof buildProjectPageImageLayouts> | null>(
    null,
  );
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);
  const [metaEntering, setMetaEntering] = useState(true);
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);
  const sliderOpenRef = useRef(false);
  const sliderCloseRef = useRef<(() => void) | null>(null);
  const [mobileFocusedImageIndex, setMobileFocusedImageIndex] = useState(0);
  const mobileScrollFocusRafRef = useRef<number | null>(null);
  const [listOverlayActive, setListOverlayActive] = useState(false);
  const [overlayBlack, setOverlayBlack] = useState(false);
  const [overlayFadeMs, setOverlayFadeMs] = useState(PROJECT_TRANSITION_BG_FADE_MS);
  const [listRevealPlan, setListRevealPlan] = useState<ColumnHidePlan | null>(null);
  const [listRevealStep, setListRevealStep] = useState(0);
  const [listRevealComplete, setListRevealComplete] = useState(false);
  const [listHiding, setListHiding] = useState(false);
  const [listHidePlan, setListHidePlan] = useState<ColumnHidePlan | null>(null);
  const [listHideStep, setListHideStep] = useState(0);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const [transitionHideStep, setTransitionHideStep] = useState(0);
  const [siteInfoRevealStep, setSiteInfoRevealStep] = useState(0);
  const [siteInfoRevealComplete, setSiteInfoRevealComplete] = useState(false);
  const { layoutMode, isMobile, information, setTransitionHidden } = useSiteInfo();
  const fontsReady = useFontsReady();

  const siteInfoSectionCount = useMemo(
    () => (isMobile ? getSiteInfoInlineSectionCount(information) : 0),
    [information, isMobile],
  );
  const isListRevealActive = listOverlayActive && !listRevealComplete && !listHiding;
  const listRevealedIndices = useMemo(
    () =>
      listRevealPlan ? new Set(flattenHideSteps(listRevealPlan.hideSteps, listRevealStep)) : null,
    [listRevealPlan, listRevealStep],
  );
  const listHideHiddenIndices = useMemo(
    () =>
      listHidePlan
        ? new Set(
            flattenHideSteps(
              listHidePlan.hideSteps,
              getProjectHideStepForCombinedStep(listHideStep, siteInfoSectionCount),
            ),
          )
        : new Set<number>(),
    [listHidePlan, listHideStep, siteInfoSectionCount],
  );
  const totalListHideSteps = (listHidePlan?.hideSteps.length ?? 0) + siteInfoSectionCount;
  const isListHideComplete =
    listHiding && listHidePlan !== null && listHideStep >= totalListHideSteps;
  const isProjectNavigating = activeTransition !== null;
  const listOverlayPointerActive = listOverlayActive && !listHiding && !isProjectNavigating;
  const listMenuOwnsTitleSlot =
    listOverlayActive &&
    !isListHideComplete &&
    (listHiding || isProjectNavigating || listRevealComplete || listRevealStep > 0);
  const showProjectMeta = fontsReady && !listMenuOwnsTitleSlot;
  const projectMetaClassName = `project-page__meta${showProjectMeta ? '' : ' project-page__meta--hidden'}${
    metaEntering && showProjectMeta ? ' project-page__meta--entering' : ''
  }${sliderIndex !== null ? ' project-page__meta--above-slider' : ''}`;
  const transitionHiddenIndices = useMemo(
    () =>
      activeTransition
        ? new Set(
            flattenHideSteps(
              activeTransition.hideSteps,
              getProjectHideStepForCombinedStep(transitionHideStep, siteInfoSectionCount),
            ),
          )
        : listHideHiddenIndices,
    [activeTransition, listHideHiddenIndices, siteInfoSectionCount, transitionHideStep],
  );

  const siteInfoStaggerHiddenIndices = useMemo(() => {
    if (!isMobile) {
      return null;
    }

    if (isProjectNavigating && transitionHideStep > 0) {
      return getSiteInfoTransitionHiddenIndices(siteInfoSectionCount, transitionHideStep);
    }

    if (listHiding && listHideStep > 0) {
      return getSiteInfoTransitionHiddenIndices(siteInfoSectionCount, listHideStep);
    }

    return null;
  }, [
    isMobile,
    isProjectNavigating,
    listHiding,
    listHideStep,
    siteInfoSectionCount,
    transitionHideStep,
  ]);

  const siteInfoStaggerRevealedIndices = useMemo(() => {
    if (!isMobile || !listOverlayActive || listHiding || isProjectNavigating) {
      return null;
    }

    if (isListRevealActive) {
      return new Set<number>();
    }

    if (siteInfoRevealComplete) {
      return null;
    }

    return new Set(
      flattenHideSteps(buildSequentialRevealSteps(siteInfoSectionCount), siteInfoRevealStep),
    );
  }, [
    isListRevealActive,
    isMobile,
    isProjectNavigating,
    listHiding,
    listOverlayActive,
    siteInfoRevealComplete,
    siteInfoRevealStep,
    siteInfoSectionCount,
  ]);

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

  const clearSiteInfoRevealTimer = useCallback(() => {
    if (siteInfoRevealTimerRef.current !== null) {
      window.clearInterval(siteInfoRevealTimerRef.current);
      siteInfoRevealTimerRef.current = null;
    }
  }, []);

  const resetListReveal = useCallback(() => {
    clearListRevealTimer();
    clearListHideTimer();
    clearSiteInfoRevealTimer();
    setListRevealPlan(null);
    setListRevealStep(0);
    setListRevealComplete(false);
    setListHiding(false);
    setListHidePlan(null);
    setListHideStep(0);
    setSiteInfoRevealStep(0);
    setSiteInfoRevealComplete(false);
  }, [clearListHideTimer, clearListRevealTimer, clearSiteInfoRevealTimer]);

  const setOverlayBackground = useCallback((black: boolean, durationMs = PROJECT_TRANSITION_BG_FADE_MS) => {
    setOverlayFadeMs(durationMs);
    setOverlayBlack(black);
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
    setOverlayBlack(false);
    resetListReveal();
  }, [clearListHideTimer, resetListReveal]);

  const scheduleFinishClose = useCallback(
    (totalHideSteps: number) => {
      if (overlayCloseTimerRef.current !== null) {
        window.clearTimeout(overlayCloseTimerRef.current);
      }

      const hideDuration =
        totalHideSteps <= 1 ? 0 : (totalHideSteps - 1) * LIST_HIDE_INTERVAL_MS;
      const totalCloseMs = Math.max(
        hideDuration + PROJECT_HOVER_FADE_OUT_MS,
        PROJECT_TRANSITION_BG_FADE_MS,
      );

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
    setOverlayBackground(true);
  }, [resetListReveal, setOverlayBackground]);

  const startCloseListOverlay = useCallback(
    (options?: { skipBackgroundFade?: boolean }) => {
      if (isListClosingRef.current || !listOverlayRef.current) {
        return;
      }

      isListClosingRef.current = true;
      clearListRevealTimer();
      setListHiding(true);

      if (!options?.skipBackgroundFade) {
        setOverlayBackground(false);
      }

      const listItems = layoutRef.current?.querySelectorAll<HTMLElement>('.project-item');
      const hidePlan = buildColumnHidePlan(Array.from(listItems ?? []), -1);
      const { hideSteps } = hidePlan;
      const mobileSiteInfoSectionCount = isMobile ? getSiteInfoInlineSectionCount(information) : 0;
      const totalHideSteps = mobileSiteInfoSectionCount + hideSteps.length;

      setListHidePlan(hidePlan);
      setListHideStep(0);

      if (totalHideSteps === 0) {
        scheduleFinishClose(0);
        return;
      }

      window.requestAnimationFrame(() => {
        setListHideStep(1);

        if (totalHideSteps === 1) {
          scheduleFinishClose(1);
          return;
        }

        hideTimerRef.current = window.setInterval(() => {
          setListHideStep((currentStep) => {
            const nextStep = currentStep + 1;

            if (nextStep >= totalHideSteps) {
              clearListHideTimer();
            }

            return nextStep;
          });
        }, LIST_HIDE_INTERVAL_MS);

        scheduleFinishClose(totalHideSteps);
      });
    },
    [
      setOverlayBackground,
      clearListHideTimer,
      clearListRevealTimer,
      information,
      isMobile,
      scheduleFinishClose,
    ],
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

  const navigateHome = useCallback(() => {
    if (isHomeNavigatingRef.current || isProjectNavigating || listHiding) {
      return;
    }

    isHomeNavigatingRef.current = true;
    sliderOpenRef.current = false;
    setSliderIndex(null);
    setTransitionHidden(true);
    router.prefetch('/');
    startHomeBackgroundTransition();

    homeNavigateTimerRef.current = window.setTimeout(() => {
      router.push('/');
    }, PROJECT_TRANSITION_BG_FADE_MS);
  }, [isProjectNavigating, listHiding, router, setTransitionHidden]);

  const handleTitleClick = useCallback(() => {
    if (listOverlayRef.current) {
      return;
    }

    navigateHome();
  }, [navigateHome]);

  const handleMobileCloseClick = useCallback(() => {
    if (sliderIndex !== null) {
      sliderCloseRef.current?.();
      return;
    }

    if (listOverlayRef.current) {
      if (!isListClosingRef.current) {
        startCloseListOverlay();
      }
      return;
    }

    navigateHome();
  }, [navigateHome, sliderIndex, startCloseListOverlay]);

  const handleCurrentProjectClick = useCallback(() => {
    if (!listOverlayRef.current || isProjectNavigating) {
      return;
    }

    const page = pageRef.current;
    const fadeMs =
      page && page.scrollTop > 0 ? SCROLL_TO_TOP_MS : PROJECT_TRANSITION_BG_FADE_MS;

    setOverlayBackground(false, fadeMs);
    scrollPageToTop();

    if (!isListClosingRef.current) {
      startCloseListOverlay({ skipBackgroundFade: true });
    }
  }, [
    setOverlayBackground,
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
      router.prefetch(`/projects/${slug}`);

      const transition: ActiveTransition = {
        slug,
        projectIndex: index,
        layout,
        hideSteps: [],
        columns: hidePlan.columns,
      };

      transitionRef.current = transition;
      transitionStartRef.current = performance.now();
      startProjectPageBackgroundTransition();
      dispatchProjectTransitionStart();
      setActiveTransition(transition);
      setTransitionHidden(true);
      setTransitionHideStep(0);
      clearSiteInfoRevealTimer();
      setSiteInfoRevealStep(0);
      setSiteInfoRevealComplete(false);
      scheduleProjectNavigation(slug);
    },
    [
      clearListRevealTimer,
      clearProjectNavigateTimers,
      clearSiteInfoRevealTimer,
      isProjectNavigating,
      listHiding,
      router,
      scheduleProjectNavigation,
      setTransitionHidden,
    ],
  );

  useLayoutEffect(() => {
    const nextLayouts = buildProjectPageImageLayouts(project.images);

    setLayouts(nextLayouts);
    setCanvasHeight(getProjectPageCanvasHeight(nextLayouts));
    setMetaEntering(true);
    setSliderIndex(null);
    sliderOpenRef.current = false;
    setMobileFocusedImageIndex(0);
    setTransitionHidden(false);
    pageRef.current?.scrollTo(0, 0);
    clearProjectTransition();
    dispatchProjectTransitionEnd();
    setProjectPageBackground(true);
  }, [project.slug, project.images, setTransitionHidden]);

  const updateMobileScrollFocusedImage = useCallback(() => {
    const page = pageRef.current;

    if (!page || sliderOpenRef.current) {
      return;
    }

    const viewportCenterY = window.innerHeight / 2;
    const wraps = page.querySelectorAll('.project-page-image-wrap');
    let bestIndex = 0;
    let bestDistance = Infinity;

    wraps.forEach((wrap, index) => {
      const rect = wrap.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - viewportCenterY);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setMobileFocusedImageIndex((current) => (current === bestIndex ? current : bestIndex));
  }, []);

  useEffect(() => {
    if (!isMobile || !layouts?.length) {
      return;
    }

    const page = pageRef.current;

    if (!page) {
      return;
    }

    const scheduleUpdate = () => {
      if (mobileScrollFocusRafRef.current !== null) {
        return;
      }

      mobileScrollFocusRafRef.current = window.requestAnimationFrame(() => {
        mobileScrollFocusRafRef.current = null;
        updateMobileScrollFocusedImage();
      });
    };

    scheduleUpdate();
    page.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      page.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);

      if (mobileScrollFocusRafRef.current !== null) {
        window.cancelAnimationFrame(mobileScrollFocusRafRef.current);
        mobileScrollFocusRafRef.current = null;
      }
    };
  }, [isMobile, layouts, updateMobileScrollFocusedImage]);

  useEffect(() => {
    if (!isMobile || sliderIndex !== null) {
      return;
    }

    updateMobileScrollFocusedImage();
  }, [isMobile, sliderIndex, updateMobileScrollFocusedImage]);

  useEffect(() => {
    if (!fontsReady || !showProjectMeta || !metaEntering) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMetaEntering(false);
    }, PROJECT_PAGE_MOUNT_FADE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fontsReady, metaEntering, showProjectMeta]);

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

  useEffect(() => {
    if (!isMobile || !listOverlayActive || listHiding || isProjectNavigating) {
      return;
    }

    if (!listRevealComplete || siteInfoRevealComplete) {
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
    }, LIST_REVEAL_INTERVAL_MS);

    return () => {
      clearSiteInfoRevealTimer();
    };
  }, [
    clearSiteInfoRevealTimer,
    isMobile,
    isProjectNavigating,
    listHiding,
    listOverlayActive,
    listRevealComplete,
    siteInfoRevealComplete,
    siteInfoSectionCount,
  ]);

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
      if (sliderOpenRef.current) {
        event.preventDefault();
        return;
      }

      if (listOverlayRef.current) {
        if (handleOverlayScrollUp(event.deltaY)) {
          event.preventDefault();
        }
        return;
      }

      if (isMobile || event.deltaY <= 0 || !isAtBottom()) {
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

      if (sliderOpenRef.current) {
        event.preventDefault();
        return;
      }

      if (listOverlayRef.current) {
        if (deltaY >= 0) {
          return;
        }

        handleOverlayScrollUp(deltaY);
        event.preventDefault();
        return;
      }

      if (isMobile || deltaY <= 0 || !isAtBottom()) {
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
  }, [handleOverlayScrollUp, isAtBottom, isMobile, openListOverlay]);

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
      if (revealTimerRef.current !== null) {
        window.clearInterval(revealTimerRef.current);
      }

      if (hideTimerRef.current !== null) {
        window.clearInterval(hideTimerRef.current);
      }

      if (siteInfoRevealTimerRef.current !== null) {
        window.clearInterval(siteInfoRevealTimerRef.current);
      }

      if (transitionHideTimerRef.current !== null) {
        window.clearInterval(transitionHideTimerRef.current);
      }

      if (navigateTimerRef.current !== null) {
        window.clearTimeout(navigateTimerRef.current);
      }

      if (homeNavigateTimerRef.current !== null) {
        window.clearTimeout(homeNavigateTimerRef.current);
      }

      if (overlayCloseTimerRef.current !== null) {
        window.clearTimeout(overlayCloseTimerRef.current);
      }

      if (scrollToTopFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollToTopFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {isMobile && fontsReady ? (
        <button
          type="button"
          className={`project-page__mobile-close text-secondary${
            sliderIndex !== null ? ' project-page__mobile-close--above-slider' : ''
          }`}
          onClick={handleMobileCloseClick}
        >
          CLOSE
        </button>
      ) : null}
      <header className={projectMetaClassName} onClick={handleTitleClick}>
        <span className="project-page__indicator text-secondary">
          <span className="project-page__indicator-sizer" aria-hidden>
            {formatProjectMeta(project.category, project.images.length)}
          </span>
          <span className="project-page__indicator-value">
            {formatProjectMeta(
              project.category,
              project.images.length,
              sliderIndex === null ? undefined : sliderIndex,
            )}
          </span>
        </span>
        <span className="project-page__title text-primary">
          {project.title} — {project.client}
        </span>
      </header>
      <div
        className={`project-page__scrim${overlayBlack ? ' project-page__scrim--on' : ''}`}
        style={{ transitionDuration: `${overlayFadeMs}ms` }}
        aria-hidden
      />
      <main
        ref={pageRef}
        className={`project-page${listOverlayActive ? ' project-page--list-overlay-active' : ''}${listHiding ? ' project-page--list-overlay-closing' : ''}${isProjectNavigating ? ' project-page--navigating' : ''}`}
      >
        <div className="project-page__canvas" style={{ height: `${canvasHeight ?? 0}px` }}>
          {layouts?.map((layout, index) => (
              <ProjectPageImage
                key={layout.image.url}
                layout={layout}
                caption={String(index + 1).padStart(2, '0')}
                mountDelayMs={index * PROJECT_PAGE_MOUNT_STAGGER_MS}
                mountFadeMs={PROJECT_PAGE_MOUNT_FADE_MS}
                scrollFocused={isMobile && mobileFocusedImageIndex === index}
                onOpen={() => {
                  if (listOverlayRef.current || isProjectNavigating) {
                    return;
                  }

                  sliderOpenRef.current = true;
                  setSliderIndex(index);
                }}
              />
          ))}
        </div>
      {listOverlayActive ? (
        <div
          ref={overlayRef}
          className={`project-page__list-overlay${listOverlayPointerActive ? ' project-page__list-overlay--visible' : ''}${listHiding ? ' project-page__list-overlay--closing' : ''}`}
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
              dismissHoverImages={isProjectNavigating || isListHideComplete}
              transitionHiddenIndices={transitionHiddenIndices}
              transitionColumns={
                activeTransition?.columns ?? listHidePlan?.columns ?? listRevealPlan?.columns ?? null
              }
              transitionTargetIndex={activeTransition?.projectIndex ?? null}
              onProjectNavigate={handleProjectNavigate}
              currentProjectSlug={project.slug}
              onCurrentProjectClick={handleCurrentProjectClick}
              isMobile={isMobile}
            />
            {isMobile ? (
              <SiteInfo
                information={information}
                isMobile
                placement="inline"
                staggerRevealedIndices={siteInfoStaggerRevealedIndices}
                staggerHiddenIndices={siteInfoStaggerHiddenIndices}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      </main>
      {sliderIndex !== null ? (
        <ProjectImageSlider
          images={project.images}
          startIndex={sliderIndex}
          onIndexChange={setSliderIndex}
          onCloseReady={(close) => {
            sliderCloseRef.current = close;
          }}
          onClose={() => {
            sliderOpenRef.current = false;
            setSliderIndex(null);
            sliderCloseRef.current = null;
          }}
        />
      ) : null}
    </>
  );
}
