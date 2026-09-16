'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { isMobileViewport } from '@/app/lib/imageLayoutCore';

type SliderImage = {
  url: string;
  width: number;
  height: number;
};

type ProjectImageSliderProps = {
  images: SliderImage[];
  startIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onCloseReady?: (close: () => void) => void;
};

const SLIDER_FADE_MS = 400;

function tooltipLabelForTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return 'CLOSE';
  }

  if (target.closest('.project-slider__hit--prev')) {
    return 'PREVIOUS';
  }

  if (target.closest('.project-slider__hit--next')) {
    return 'NEXT';
  }

  return 'CLOSE';
}

export function ProjectImageSlider({
  images,
  startIndex,
  onClose,
  onIndexChange,
  onCloseReady,
}: ProjectImageSliderProps) {
  const indexRef = useRef(startIndex);
  const closingRef = useRef(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(startIndex);

  const goTo = useCallback(
    (nextIndex: number) => {
      const wrapped = (nextIndex + images.length) % images.length;
      indexRef.current = wrapped;
      setIndex(wrapped);
      onIndexChange?.(wrapped);
    },
    [images.length, onIndexChange],
  );

  const close = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    setVisible(false);
    window.setTimeout(onClose, SLIDER_FADE_MS);
  }, [onClose]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(indexRef.current - 1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(indexRef.current + 1);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [close, goTo]);

  useEffect(() => {
    onCloseReady?.(close);

    return () => {
      onCloseReady?.(() => {});
    };
  }, [close, onCloseReady]);

  const image = images[index];

  if (!image) {
    return null;
  }

  return (
    <div
      className={`project-slider${visible ? ' project-slider--visible' : ''}`}
      onClick={close}
      onMouseMove={(event) => {
        if (isMobileViewport()) {
          return;
        }

        const tooltip = tooltipRef.current;
        if (!tooltip) {
          return;
        }

        tooltip.textContent = tooltipLabelForTarget(event.target);
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
        tooltip.classList.add('project-slider__tooltip--visible');
      }}
      onMouseLeave={() => {
        if (isMobileViewport()) {
          return;
        }

        tooltipRef.current?.classList.remove('project-slider__tooltip--visible');
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Project images"
    >
      <div className="project-slider__image-wrap">
        <img
          src={image.url}
          width={image.width}
          height={image.height}
          alt=""
          className="project-slider__image"
          draggable={false}
        />
        <button
          type="button"
          className="project-slider__hit project-slider__hit--prev"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            goTo(index - 1);
          }}
        />
        <button
          type="button"
          className="project-slider__hit project-slider__hit--next"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            goTo(index + 1);
          }}
        />
      </div>
      <span ref={tooltipRef} className="project-slider__tooltip text-secondary" aria-hidden="true" />
    </div>
  );
}
