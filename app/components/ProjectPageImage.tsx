'use client';

import { useEffect, useRef, useState } from 'react';

import type { RandomImageLayout } from '@/app/lib/imageLayoutCore';

type ProjectPageImageProps = {
  layout: RandomImageLayout;
  caption: string;
  skipMountFade?: boolean;
  opacityRiseFromHome?: boolean;
  opacityRiseMs?: number;
  mountDelayMs?: number;
  mountFadeMs?: number;
  positionFixed?: boolean;
  onReady?: () => void;
};

export function ProjectPageImage({
  layout,
  caption,
  skipMountFade = false,
  opacityRiseFromHome = false,
  opacityRiseMs = 1000,
  mountDelayMs = 0,
  mountFadeMs = 400,
  positionFixed = false,
  onReady,
}: ProjectPageImageProps) {
  const { image, isLandscape, top, left, boxWidth, boxHeight, renderWidth, renderHeight } = layout;
  const [mounting, setMounting] = useState(!skipMountFade && !opacityRiseFromHome);
  const [opacityRiseActive, setOpacityRiseActive] = useState(false);
  const [active, setActive] = useState(false);
  const [exiting, setExiting] = useState(false);
  const readyReportedRef = useRef(false);
  const imageLoadedRef = useRef(false);
  const opacityDoneRef = useRef(false);

  useEffect(() => {
    readyReportedRef.current = false;
    imageLoadedRef.current = false;
    opacityDoneRef.current = false;
  }, [image.url]);

  useEffect(() => {
    if (!opacityRiseFromHome) {
      return;
    }

    if (opacityRiseMs <= 0) {
      setOpacityRiseActive(true);
      opacityDoneRef.current = true;
      tryReportReady();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setOpacityRiseActive(true);
      });
    });

    const fallback = window.setTimeout(() => {
      opacityDoneRef.current = true;
      tryReportReady();
    }, opacityRiseMs + 50);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, [opacityRiseFromHome, opacityRiseMs, image.url]);

  const tryReportReady = () => {
    if (readyReportedRef.current) {
      return;
    }

    if (!imageLoadedRef.current) {
      return;
    }

    if (opacityRiseFromHome && !opacityDoneRef.current) {
      return;
    }

    readyReportedRef.current = true;
    onReady?.();
  };

  const handleImageLoad = () => {
    imageLoadedRef.current = true;
    tryReportReady();
  };

  const handleOpacityTransitionEnd = (event: React.TransitionEvent<HTMLImageElement>) => {
    if (event.propertyName !== 'opacity' || !opacityRiseFromHome) {
      return;
    }

    opacityDoneRef.current = true;
    tryReportReady();
  };

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

    if (event.animationName.endsWith('project-page-image-mount-in')) {
      setMounting(false);
      return;
    }

    if (event.animationName.endsWith('project-page-image-fade-out')) {
      setActive(false);
      setExiting(false);
    }
  };

  const mountAnimationClass = mounting ? 'project-page-image--mount' : '';

  const imageAnimationClass = exiting
    ? 'project-page-image--exit'
    : active
      ? 'project-page-image--enter'
      : opacityRiseFromHome
        ? `project-page-image--from-home${opacityRiseActive ? ' project-page-image--at-rest' : ''}`
        : mountAnimationClass;

  const captionAnimationClass = mounting && !opacityRiseFromHome ? mountAnimationClass : '';

  const animationTimingStyle = mounting
    ? {
        ...(mountDelayMs > 0 ? { animationDelay: `${mountDelayMs}ms` } : {}),
        animationDuration: `${mountFadeMs}ms`,
      }
    : undefined;

  const opacityRiseStyle = opacityRiseFromHome
    ? { transitionDuration: `${opacityRiseMs}ms` }
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
            ...opacityRiseStyle,
          }}
          onAnimationEnd={handleAnimationEnd}
          onTransitionEnd={handleOpacityTransitionEnd}
          onLoad={handleImageLoad}
        />
      </div>
      <span
        className={`project-page-image__caption text-secondary ${captionAnimationClass}${opacityRiseFromHome ? ' project-page-image__caption--handoff-hidden' : ''}`}
        style={animationTimingStyle}
        onAnimationEnd={handleAnimationEnd}
      >
        {caption}
      </span>
    </div>
  );
}
