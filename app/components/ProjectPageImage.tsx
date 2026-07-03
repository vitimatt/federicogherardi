'use client';

import { useState } from 'react';

import type { RandomImageLayout } from '@/app/lib/imageLayoutCore';

type ProjectPageImageProps = {
  layout: RandomImageLayout;
  caption: string;
  skipMountFade?: boolean;
  opacityRiseFromHome?: boolean;
  mountDelayMs?: number;
  mountFadeMs?: number;
  positionFixed?: boolean;
};

export function ProjectPageImage({
  layout,
  caption,
  skipMountFade = false,
  opacityRiseFromHome = false,
  mountDelayMs = 0,
  mountFadeMs = 400,
  positionFixed = false,
}: ProjectPageImageProps) {
  const { image, isLandscape, top, left, boxWidth, boxHeight, renderWidth, renderHeight } = layout;
  const [mounting, setMounting] = useState(opacityRiseFromHome || !skipMountFade);
  const [active, setActive] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleMouseEnter = () => {
    setExiting(false);
    setActive(true);
  };

  const handleMouseLeave = () => {
    setExiting(true);
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLElement>) => {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (
      event.animationName.endsWith('project-page-image-mount-in') ||
      event.animationName.endsWith('project-image-opacity-rise')
    ) {
      setMounting(false);
      return;
    }

    if (event.animationName.endsWith('project-page-image-fade-out')) {
      setActive(false);
      setExiting(false);
    }
  };

  const mountAnimationClass = mounting
    ? opacityRiseFromHome
      ? 'project-page-image--opacity-rise'
      : 'project-page-image--mount'
    : '';

  const imageAnimationClass = exiting
    ? 'project-page-image--exit'
    : active
      ? 'project-page-image--enter'
      : mountAnimationClass;

  const captionAnimationClass = mounting ? mountAnimationClass : '';

  const animationTimingStyle = mounting
    ? {
        ...(mountDelayMs > 0 ? { animationDelay: `${mountDelayMs}ms` } : {}),
        animationDuration: `${mountFadeMs}ms`,
      }
    : undefined;

  return (
    <div
      className={`project-page-image-wrap${positionFixed ? ' project-page-image-wrap--handoff-fixed' : ''}`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${isLandscape ? boxWidth : renderWidth}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="project-page-image-frame"
        style={{
          width: `${isLandscape ? boxWidth : renderWidth}px`,
          height: `${isLandscape ? boxHeight : renderHeight}px`,
        }}
      >
        <img
          src={image.url}
          width={image.width}
          height={image.height}
          alt=""
          className={`project-page-image ${isLandscape ? 'project-page-image--rotated' : 'project-page-image--portrait'} ${imageAnimationClass}`}
          style={{
            ...(isLandscape
              ? {
                  width: `${renderWidth}px`,
                  height: `${renderHeight}px`,
                }
              : {}),
            ...animationTimingStyle,
          }}
          onAnimationEnd={handleAnimationEnd}
        />
      </div>
      <span
        className={`project-page-image__caption text-secondary ${captionAnimationClass}`}
        style={animationTimingStyle}
        onAnimationEnd={handleAnimationEnd}
      >
        {caption}
      </span>
    </div>
  );
}
