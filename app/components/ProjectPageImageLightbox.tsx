'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getImageBounds,
  scaleBoundsToFitViewport,
  type RandomImageLayout,
} from '@/app/lib/imageLayoutCore';

import { IMAGE_FADE_MS } from '@/app/lib/imageOpacity';

const LIGHTBOX_FADE_MS = IMAGE_FADE_MS;

type ProjectPageImageLightboxProps = {
  layout: RandomImageLayout;
  onClose: () => void;
};

export function ProjectPageImageLightbox({ layout, onClose }: ProjectPageImageLightboxProps) {
  const { image, isLandscape } = layout;
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closedRef = useRef(false);

  const bounds = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rawBounds = getImageBounds(image, 100, isLandscape, viewportWidth);

    return scaleBoundsToFitViewport(rawBounds, viewportWidth, viewportHeight);
  }, [image, isLandscape]);

  const finishClose = useCallback(() => {
    if (closedRef.current) {
      return;
    }

    closedRef.current = true;
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closing) {
      return;
    }

    setClosing(true);
    setVisible(false);
  }, [closing]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [requestClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!closing) {
      return;
    }

    const timeout = window.setTimeout(finishClose, LIGHTBOX_FADE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [closing, finishClose]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target || event.propertyName !== 'opacity' || !closing) {
      return;
    }

    finishClose();
  };

  return (
    <div
      className={`project-page-image-lightbox${visible ? ' project-page-image-lightbox--visible' : ''}`}
      onClick={requestClose}
      onTransitionEnd={handleTransitionEnd}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="project-page-image-lightbox__content"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="project-page-image-lightbox__frame"
          style={{
            width: `${isLandscape ? bounds.boxWidth : bounds.renderWidth}px`,
            height: `${isLandscape ? bounds.boxHeight : bounds.renderHeight}px`,
          }}
        >
          <img
            src={image.url}
            width={image.width}
            height={image.height}
            alt=""
            className={`project-page-image-lightbox__image ${isLandscape ? 'project-page-image-lightbox__image--rotated' : 'project-page-image-lightbox__image--portrait'}`}
            style={
              isLandscape
                ? {
                    width: `${bounds.renderWidth}px`,
                    height: `${bounds.renderHeight}px`,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
