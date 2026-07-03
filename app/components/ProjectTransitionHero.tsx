'use client';

import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type ProjectTransitionHeroProps = {
  layout: RandomImageLayout;
};

export function ProjectTransitionHero({ layout }: ProjectTransitionHeroProps) {
  const { image, isLandscape, top, left, boxWidth, boxHeight, renderWidth, renderHeight } = layout;

  if (!isLandscape) {
    return (
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        className="project-transition-hero"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${renderWidth}px`,
          height: 'auto',
        }}
      />
    );
  }

  return (
    <div
      className="project-transition-hero-wrap"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
      }}
    >
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        className="project-transition-hero project-transition-hero--rotated"
        style={{
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
        }}
      />
    </div>
  );
}
