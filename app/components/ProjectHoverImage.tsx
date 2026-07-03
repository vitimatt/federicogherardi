'use client';

import type { RandomImageLayout } from '@/app/lib/randomImageLayout';

type ProjectHoverImageProps = {
  layout: RandomImageLayout & { id: string };
  exiting?: boolean;
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

export function ProjectHoverImage({ layout, exiting, onExitComplete }: ProjectHoverImageProps) {
  const { image, isLandscape, top, left, boxWidth, boxHeight, renderWidth, renderHeight, id } =
    layout;
  const animationClass = exiting ? 'project-hover-image--exit' : 'project-hover-image--enter';

  if (!isLandscape) {
    return (
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        className={`project-hover-image ${animationClass}`}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${renderWidth}px`,
          height: 'auto',
        }}
        onAnimationEnd={(event) => handleAnimationEnd(event, exiting, id, onExitComplete)}
      />
    );
  }

  return (
    <div
      className={`project-hover-image-wrap ${animationClass}`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
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
