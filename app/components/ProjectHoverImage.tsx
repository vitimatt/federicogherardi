'use client';

import { useEffect, useState } from 'react';

import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type ProjectHoverImageProps = {
  layout: RandomImageLayout & { id: string };
  exiting?: boolean;
  transitionHero?: boolean;
  opacityRiseMs?: number;
  onExitComplete?: (id: string) => void;
};

function handleAnimationEnd(
  event: React.AnimationEvent<HTMLElement>,
  exiting: boolean | undefined,
  id: string,
  onExitComplete?: (id: string) => void,
) {
  if (!exiting || event.currentTarget !== event.target) {
    return;
  }

  if (event.animationName.endsWith('project-hover-fade-out')) {
    onExitComplete?.(id);
  }
}

export function ProjectHoverImage({
  layout,
  exiting,
  transitionHero = false,
  opacityRiseMs = 1000,
  onExitComplete,
}: ProjectHoverImageProps) {
  const { image, isLandscape, top, left, boxWidth, boxHeight, renderWidth, renderHeight, id } =
    layout;
  const [opacityRiseActive, setOpacityRiseActive] = useState(false);

  useEffect(() => {
    if (!transitionHero) {
      setOpacityRiseActive(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setOpacityRiseActive(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [transitionHero, id]);

  const animationClass = transitionHero
    ? `project-hover-image--transition-hero${opacityRiseActive ? ' project-hover-image--transition-hero-active' : ''}`
    : exiting
      ? 'project-hover-image--exit'
      : 'project-hover-image--enter';

  const opacityRiseStyle = transitionHero ? { transitionDuration: `${opacityRiseMs}ms` } : undefined;

  if (!isLandscape) {
    return (
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        data-transition-hover-id={id}
        className={`project-hover-image ${animationClass}`}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${renderWidth}px`,
          height: 'auto',
          ...opacityRiseStyle,
        }}
        onAnimationEnd={(event) => handleAnimationEnd(event, exiting, id, onExitComplete)}
      />
    );
  }

  return (
    <div
      data-transition-hover-id={id}
      className={`project-hover-image-wrap ${animationClass}`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
        ...opacityRiseStyle,
      }}
      onAnimationEnd={(event) => handleAnimationEnd(event, exiting, id, onExitComplete)}
    >
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        className="project-hover-image project-hover-image--rotated"
        style={{
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
        }}
      />
    </div>
  );
}
