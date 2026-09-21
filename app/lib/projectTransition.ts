import type { RandomImageLayout } from '@/app/lib/randomImageLayout';
import { FONT_FADE_MS } from '@/app/lib/siteFonts';

export type ProjectTransitionPayload = {
  slug: string;
  projectId: string;
  projectIndex: number;
  layout: RandomImageLayout;
  category: string;
  title: string;
  client: string;
  imageCount: number;
  startedAt: number;
};

export const PROJECT_TRANSITION_BG_FADE_MS = 1000;

/** @deprecated Use PROJECT_TRANSITION_BG_FADE_MS — hero opacity rise is synced to background fade. */
export const PROJECT_TRANSITION_HERO_RISE_MS = PROJECT_TRANSITION_BG_FADE_MS;

export type ColumnHidePlan = {
  hideSteps: number[][];
  columns: number[][];
};

const STORAGE_KEY = 'project-transition';
const SKIP_HOME_OPENING_KEY = 'skip-home-opening';
const PROJECT_PAGE_BODY_CLASS = 'body--project-page';
const PROJECT_TRANSITION_BODY_CLASS = 'body--project-transition';
const HOME_TRANSITION_BODY_CLASS = 'body--home-transition';
const HOME_TRANSITION_REVEAL_BODY_CLASS = 'body--home-transition-reveal';

export const PROJECT_TRANSITION_START_EVENT = 'project-transition-start';
export const PROJECT_TRANSITION_RISE_EVENT = 'project-transition-rise';
export const PROJECT_TRANSITION_END_EVENT = 'project-transition-end';

export function startProjectPageBackgroundTransition() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.add(PROJECT_TRANSITION_BODY_CLASS);
  document.body.classList.add(PROJECT_TRANSITION_BODY_CLASS);
}

export function dispatchProjectTransitionStart() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PROJECT_TRANSITION_START_EVENT));
}

export function dispatchProjectTransitionRise() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PROJECT_TRANSITION_RISE_EVENT));
}

export function dispatchProjectTransitionEnd() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(PROJECT_TRANSITION_END_EVENT));
}

export function setProjectPageBackground(active: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  if (active) {
    document.documentElement.classList.add(PROJECT_PAGE_BODY_CLASS);
    document.body.classList.add(PROJECT_PAGE_BODY_CLASS);
    document.documentElement.classList.remove(PROJECT_TRANSITION_BODY_CLASS, HOME_TRANSITION_BODY_CLASS);
    document.body.classList.remove(PROJECT_TRANSITION_BODY_CLASS, HOME_TRANSITION_BODY_CLASS);
    return;
  }

  document.documentElement.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
  document.body.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
}

export function startHomeBackgroundTransition() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
  document.body.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
  document.documentElement.classList.add(HOME_TRANSITION_BODY_CLASS);
  document.body.classList.add(HOME_TRANSITION_BODY_CLASS);
  sessionStorage.setItem(SKIP_HOME_OPENING_KEY, '1');
}

export function consumeSkipHomeOpening() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (sessionStorage.getItem(SKIP_HOME_OPENING_KEY) === '1') {
    sessionStorage.removeItem(SKIP_HOME_OPENING_KEY);
    return true;
  }

  return isHomeBackgroundTransitionActive();
}

export function clearHomeBackgroundTransition() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.remove(
    HOME_TRANSITION_BODY_CLASS,
    HOME_TRANSITION_REVEAL_BODY_CLASS,
  );
  document.body.classList.remove(HOME_TRANSITION_BODY_CLASS, HOME_TRANSITION_REVEAL_BODY_CLASS);
}

export function replaySiteTextFadeIn() {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  if (!root.classList.contains('fonts-ready')) {
    return;
  }

  root.classList.remove('fonts-ready');

  window.requestAnimationFrame(() => {
    root.classList.add('fonts-ready', 'fonts-fading');
    window.setTimeout(() => {
      root.classList.remove('fonts-fading');
    }, FONT_FADE_MS);
  });
}

/** Fade the black veil out and replay the homepage text fade-in after project → home navigation. */
export function beginHomeBackgroundTransitionReveal() {
  if (typeof document === 'undefined' || !isHomeBackgroundTransitionActive()) {
    return () => {};
  }

  replaySiteTextFadeIn();
  document.documentElement.classList.add(HOME_TRANSITION_REVEAL_BODY_CLASS);
  document.body.classList.add(HOME_TRANSITION_REVEAL_BODY_CLASS);

  const timer = window.setTimeout(() => {
    clearHomeBackgroundTransition();
  }, PROJECT_TRANSITION_BG_FADE_MS);

  return () => {
    window.clearTimeout(timer);
  };
}

export function isHomeBackgroundTransitionActive() {
  if (typeof document === 'undefined') {
    return false;
  }

  return (
    document.body.classList.contains(HOME_TRANSITION_BODY_CLASS) ||
    document.documentElement.classList.contains(HOME_TRANSITION_BODY_CLASS)
  );
}

export function saveProjectTransition(
  payload: Omit<ProjectTransitionPayload, 'startedAt'>,
) {
  const fullPayload: ProjectTransitionPayload = {
    ...payload,
    startedAt: Date.now(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullPayload));
}

export function getProjectTransitionRemainingMs(
  startedAt: number,
  durationMs = PROJECT_TRANSITION_BG_FADE_MS,
) {
  return Math.max(0, durationMs - (Date.now() - startedAt));
}

export function readProjectTransitionPayload() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ProjectTransitionPayload;
  } catch {
    return null;
  }
}

export function readProjectTransition(slug: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const payload = readProjectTransitionPayload();

  if (!payload || payload.slug !== slug) {
    return null;
  }

  return payload;
}

export function clearProjectTransition() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function groupItemsIntoColumns(items: HTMLElement[]) {
  const columnMap = new Map<number, { index: number; top: number; bottom: number }[]>();

  for (const element of items) {
    const index = Number(element.dataset.projectIndex);

    if (Number.isNaN(index)) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const columnLeft = Math.round(rect.left);

    if (!columnMap.has(columnLeft)) {
      columnMap.set(columnLeft, []);
    }

    columnMap.get(columnLeft)!.push({ index, top: rect.top, bottom: rect.bottom });
  }

  return Array.from(columnMap.entries())
    .sort(([leftA], [leftB]) => leftA - leftB)
    .map(([, entries]) =>
      entries.sort((a, b) => a.top - b.top).map((entry) => entry.index),
    );
}

export function buildColumnRevealPlan(items: HTMLElement[]): ColumnHidePlan {
  if (items.length === 0) {
    return { hideSteps: [], columns: [] };
  }

  const columns = groupItemsIntoColumns(items);
  const columnQueues = columns.map((column) => column.slice());
  const revealSteps: number[][] = [];
  let continueRevealing = true;

  while (continueRevealing) {
    const step: number[] = [];

    continueRevealing = false;
    for (const queue of columnQueues) {
      if (queue.length > 0) {
        step.push(queue.shift()!);
        continueRevealing = true;
      }
    }

    if (step.length > 0) {
      revealSteps.push(step);
    }
  }

  return { hideSteps: revealSteps, columns };
}

export function buildColumnHidePlan(items: HTMLElement[], skipIndex: number): ColumnHidePlan {
  const visibleItems = items.filter(
    (element) =>
      !Number.isNaN(Number(element.dataset.projectIndex)) &&
      !element.classList.contains('project-item--hidden') &&
      !element.classList.contains('project-item--transition-hidden'),
  );

  if (visibleItems.length === 0) {
    return { hideSteps: [], columns: [] };
  }

  const columns = groupItemsIntoColumns(visibleItems);
  const columnQueues = columns.map((column) =>
    column.filter((index) => index !== skipIndex).slice().reverse(),
  );

  const hideSteps: number[][] = [];
  let continueHiding = true;

  while (continueHiding) {
    const step: number[] = [];

    continueHiding = false;
    for (const queue of columnQueues) {
      if (queue.length > 0) {
        step.push(queue.shift()!);
        continueHiding = true;
      }
    }

    if (step.length > 0) {
      hideSteps.push(step);
    }
  }

  return { hideSteps, columns };
}

export function flattenHideSteps(hideSteps: number[][], stepCount: number) {
  return hideSteps.slice(0, stepCount).flat();
}

export function buildSequentialRevealSteps(count: number): number[][] {
  return Array.from({ length: count }, (_, index) => [index]);
}

export function getSiteInfoTransitionHiddenIndices(sectionCount: number, step: number) {
  const hidden = new Set<number>();

  for (let index = 0; index < Math.min(step, sectionCount); index += 1) {
    hidden.add(sectionCount - 1 - index);
  }

  return hidden;
}

export function getProjectHideStepForCombinedStep(
  combinedStep: number,
  siteInfoSectionCount: number,
) {
  return Math.max(0, combinedStep - siteInfoSectionCount);
}
