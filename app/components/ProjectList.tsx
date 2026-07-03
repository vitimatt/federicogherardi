'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ProjectHoverImage } from '@/app/components/ProjectHoverImage';
import { syncLayoutFromDom } from '@/app/lib/imageLayoutCore';
import { createRandomImageLayout, type RandomImageLayout } from '@/app/lib/randomImageLayout';
import { formatProjectMeta } from '@/app/lib/formatProjectMeta';
import { buildColumnHidePlan, buildColumnRevealPlan, type ColumnHidePlan } from '@/app/lib/projectTransition';

type ProjectImage = {
  url: string;
  width: number;
  height: number;
};

export type ProjectListItem = {
  _id: string;
  title: string;
  slug?: string | null;
  category: string;
  client: string;
  imageCount: number;
  firstImage?: ProjectImage | null;
  images?: ProjectImage[];
};


function isFakeProject(project: ProjectListItem) {
  return project._id.startsWith('fake-');
}

function getProjectImages(project: ProjectListItem) {
  if (project.images?.length) {
    return project.images;
  }

  return project.firstImage ? [project.firstImage] : [];
}

function pickRandomImage(images: ProjectImage[]) {
  return images[Math.floor(Math.random() * images.length)] ?? null;
}

const MAX_HOVER_IMAGES = 2;
const HOVER_FADE_DELAY_MS = 2000;

type HoverImageEntry = RandomImageLayout & {
  id: string;
  projectId: string;
  exiting?: boolean;
};

type ProjectListProps = {
  projects: ProjectListItem[];
  isOpeningReveal?: boolean;
  openingRevealPlan?: ColumnHidePlan | null;
  openingRevealedIndices?: Set<number> | null;
  onOpeningRevealPlanReady?: (plan: ColumnHidePlan) => void;
  isTransitioning?: boolean;
  transitionHiddenIndices?: Set<number>;
  transitionColumns?: number[][] | null;
  transitionTargetIndex?: number | null;
  onProjectNavigate?: (
    project: ProjectListItem,
    index: number,
    layout: RandomImageLayout,
    hidePlan: ColumnHidePlan,
  ) => void;
  currentProjectSlug?: string;
  onCurrentProjectClick?: () => void;
};

export function ProjectList({
  projects,
  isOpeningReveal = false,
  openingRevealPlan = null,
  openingRevealedIndices = null,
  onOpeningRevealPlanReady,
  isTransitioning = false,
  transitionHiddenIndices,
  transitionColumns = null,
  transitionTargetIndex = null,
  onProjectNavigate,
  currentProjectSlug,
  onCurrentProjectClick,
}: ProjectListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const hoveredProjectRef = useRef<string | null>(null);
  const fadeTimersRef = useRef<Map<string, number>>(new Map());
  const [hoveredLayouts, setHoveredLayouts] = useState<HoverImageEntry[]>([]);
  const imagePool = projects
    .filter((project) => !isFakeProject(project))
    .flatMap((project) => getProjectImages(project));

  const cancelProjectFadeOut = (projectId: string) => {
    const timer = fadeTimersRef.current.get(projectId);

    if (timer !== undefined) {
      window.clearTimeout(timer);
      fadeTimersRef.current.delete(projectId);
    }
  };

  const markProjectImagesExiting = (projectId: string) => {
    setHoveredLayouts((current) => {
      let changed = false;

      const next = current.map((entry) => {
        if (entry.projectId === projectId && !entry.exiting) {
          changed = true;
          return { ...entry, exiting: true };
        }

        return entry;
      });

      return changed ? next : current;
    });
  };

  const scheduleProjectFadeOut = (projectId: string) => {
    cancelProjectFadeOut(projectId);

    const timer = window.setTimeout(() => {
      fadeTimersRef.current.delete(projectId);

      if (hoveredProjectRef.current !== projectId) {
        markProjectImagesExiting(projectId);
      }
    }, HOVER_FADE_DELAY_MS);

    fadeTimersRef.current.set(projectId, timer);
  };

  const addHoverImage = (image: ProjectImage, projectId: string) => {
    cancelProjectFadeOut(projectId);

    setHoveredLayouts((current) => {
      const active = current.filter((entry) => !entry.exiting);
      const previousLayouts = active.slice(-2);
      const newEntry: HoverImageEntry = {
        ...createRandomImageLayout(image, previousLayouts),
        id: crypto.randomUUID(),
        projectId,
      };

      let next = [...current, newEntry];

      if (active.length >= MAX_HOVER_IMAGES) {
        const oldestActive = active[0];
        next = next.map((entry) =>
          entry.id === oldestActive.id ? { ...entry, exiting: true } : entry,
        );
      }

      return next;
    });
  };

  const removeHoverImage = (id: string) => {
    setHoveredLayouts((current) => current.filter((entry) => entry.id !== id));
  };

  const handleProjectClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    project: ProjectListItem,
    index: number,
  ) => {
    if (isTransitioning) {
      event.preventDefault();
      return;
    }

    if (currentProjectSlug && project.slug === currentProjectSlug) {
      event.preventDefault();
      onCurrentProjectClick?.();
      return;
    }

    if (!onProjectNavigate || !project.slug) {
      return;
    }

    event.preventDefault();

    const activeLayout = hoveredLayouts.find(
      (entry) => entry.projectId === project._id && !entry.exiting,
    );

    let layout =
      activeLayout ??
      (project.firstImage ? createRandomImageLayout(project.firstImage, []) : null);

    if (!layout) {
      return;
    }

    if (activeLayout) {
      const hoverNode = document.querySelector<HTMLElement>(
        `[data-transition-hover-id="${activeLayout.id}"]`,
      );

      if (hoverNode) {
        layout = syncLayoutFromDom(layout, hoverNode);
      }
    }

    const listItems = listRef.current?.querySelectorAll<HTMLElement>('.project-item');
    const hidePlan = buildColumnHidePlan(Array.from(listItems ?? []), index);

    onProjectNavigate?.(project, index, layout, hidePlan);
  };

  const handleProjectMouseEnter = (project: ProjectListItem, fake: boolean) => {
    if (isTransitioning) {
      return;
    }

    hoveredProjectRef.current = project._id;
    cancelProjectFadeOut(project._id);

    if (fake) {
      const image = pickRandomImage(imagePool);
      if (image) {
        addHoverImage(image, project._id);
      }
      return;
    }

    if (project.firstImage) {
      addHoverImage(project.firstImage, project._id);
    }
  };

  const handleProjectMouseLeave = (projectId: string) => {
    if (isTransitioning) {
      return;
    }

    if (hoveredProjectRef.current === projectId) {
      hoveredProjectRef.current = null;
    }

    scheduleProjectFadeOut(projectId);
  };

  useEffect(() => {
    const timers = fadeTimersRef.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpeningReveal || openingRevealPlan || !onOpeningRevealPlanReady) {
      return;
    }

    const listItems = listRef.current?.querySelectorAll<HTMLElement>('.project-item');

    if (!listItems?.length) {
      return;
    }

    onOpeningRevealPlanReady(buildColumnRevealPlan(Array.from(listItems)));
  }, [isOpeningReveal, openingRevealPlan, onOpeningRevealPlanReady, projects]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const syncIndicatorWidth = () => {
      const layout = list.closest<HTMLElement>('.home-layout, .project-page__list-layout');

      list.style.removeProperty('--indicator-width');
      layout?.style.removeProperty('--indicator-width');

      const indicators =
        layout?.querySelectorAll<HTMLElement>(
          '.project-item:not(.project-item--hidden):not(.project-item--transition-hidden) .project-item__indicator, .site-info__indicator',
        ) ??
        list.querySelectorAll<HTMLElement>(
          '.project-item:not(.project-item--hidden):not(.project-item--transition-hidden) .project-item__indicator',
        );
      let maxWidth = 0;

      indicators.forEach((indicator) => {
        maxWidth = Math.max(maxWidth, indicator.scrollWidth);
      });

      if (maxWidth > 0) {
        list.style.setProperty('--indicator-width', `${maxWidth}px`);
        layout?.style.setProperty('--indicator-width', `${maxWidth}px`);
      }
    };

    syncIndicatorWidth();
    document.fonts?.ready.then(syncIndicatorWidth);
    window.addEventListener('resize', syncIndicatorWidth);

    return () => window.removeEventListener('resize', syncIndicatorWidth);
  }, [projects, isOpeningReveal, openingRevealPlan, openingRevealedIndices, isTransitioning, transitionHiddenIndices]);

  const renderProjectItem = (index: number) => {
    const project = projects[index];
    const fake = isFakeProject(project);
    const isMeasuring = isOpeningReveal && !openingRevealPlan;
    const isLoadHidden =
      isOpeningReveal && openingRevealedIndices
        ? !openingRevealedIndices.has(index)
        : false;
    const isTransitionHidden = Boolean(transitionHiddenIndices?.has(index));
    const hasHoverImage = fake ? imagePool.length > 0 : Boolean(project.firstImage);
    const isClickable = !fake && Boolean(project.slug);
    const isTransitionTarget = isTransitioning && index === transitionTargetIndex;
    const content = (
      <div className="project-item__content">
        <span className="project-item__indicator text-secondary">
          {formatProjectMeta(project.category, project.imageCount)}
        </span>
        <span className="project-item__title text-primary">
          {project.title} — {project.client}
        </span>
      </div>
    );

    return (
      <li
        key={project._id}
        data-project-index={index}
        className={`project-item ${isLoadHidden ? 'project-item--hidden' : ''} ${isMeasuring ? 'project-item--load-measuring' : ''} ${isTransitionHidden ? 'project-item--transition-hidden' : ''} ${isTransitionTarget ? 'project-item--transition-target' : ''} ${hasHoverImage ? 'project-item--has-image' : ''} ${isClickable ? 'project-item--clickable' : ''}`}
        aria-hidden={fake || undefined}
        onMouseEnter={() => handleProjectMouseEnter(project, fake)}
        onMouseLeave={() => handleProjectMouseLeave(project._id)}
      >
        {isClickable ? (
          <Link
            href={`/projects/${project.slug}`}
            className="project-item__link"
            onClick={(event) => handleProjectClick(event, project, index)}
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </li>
    );
  };

  const useFixedColumns =
    (isTransitioning && transitionColumns && transitionColumns.length > 0) ||
    (isOpeningReveal && openingRevealPlan && openingRevealPlan.columns.length > 0);

  const fixedColumns =
    isTransitioning && transitionColumns
      ? transitionColumns
      : openingRevealPlan?.columns ?? null;

  return (
    <>
      <div ref={listRef}>
        {useFixedColumns && fixedColumns ? (
          <div className="project-columns-transition">
            {fixedColumns.map((columnIndices, columnIndex) => (
              <ul key={columnIndex} className="project-column">
                {columnIndices.map((index) => renderProjectItem(index))}
              </ul>
            ))}
          </div>
        ) : (
          <ul className="project-columns">{projects.map((_, index) => renderProjectItem(index))}</ul>
        )}
      </div>
      {isTransitioning
        ? null
        : hoveredLayouts.map((layout) => (
            <ProjectHoverImage
              key={layout.id}
              layout={layout}
              exiting={layout.exiting}
              onExitComplete={removeHoverImage}
            />
          ))}
    </>
  );
}
