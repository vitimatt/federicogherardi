import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

export type ProjectTransitionPayload = {
  slug: string;
  projectId: string;
  projectIndex: number;
  layout: RandomImageLayout;
  startedAt: number;
};

export const PROJECT_TRANSITION_BG_FADE_MS = 1000;
export const PROJECT_TRANSITION_HERO_RISE_MS = 800;

export type ColumnHidePlan = {
  hideSteps: number[][];
  columns: number[][];
};

const STORAGE_KEY = 'project-transition';
const PROJECT_PAGE_BODY_CLASS = 'body--project-page';
const PROJECT_TRANSITION_BODY_CLASS = 'body--project-transition';

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
    document.documentElement.classList.remove(PROJECT_TRANSITION_BODY_CLASS);
    document.body.classList.remove(PROJECT_TRANSITION_BODY_CLASS);
    return;
  }

  document.documentElement.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
  document.body.classList.remove(PROJECT_PAGE_BODY_CLASS, PROJECT_TRANSITION_BODY_CLASS);
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
