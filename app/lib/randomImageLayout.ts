/**
 * Homepage hover image layout
 * ---------------------------
 *
 * SIZING
 * - Random size from 25, 30, or 35 vw on desktop (50, 60, or 70 vw on mobile).
 * - Landscape images are rotated 90° inside their bounding box.
 * - Scaled to fit the viewport.
 *
 * POSITIONING
 * - Fixed to the viewport with 20 px margins.
 * - Image 1: random position.
 * - Images 2+: must overlap the previous 1–2 images by 1–100 px on both axes.
 * - No triple overlap.
 */

import {
  buildLayout,
  clampToViewport,
  getImageBounds,
  getOverlap,
  getRandomPosition,
  getRecentRects,
  getSmallestImageSizeVw,
  hasTripleOverlap,
  isLandscapeImage,
  MAX_OVERLAP_PX,
  PAGE_MARGIN_PX,
  pickRandom,
  PLACEMENT_SCAN_STEP_PX,
  rectFromPlacement,
  scaleBoundsToFitViewport,
  shuffleSizes,
  type ImageBounds,
  type ImageRect,
  type Overlap,
  type Placement,
  type ProjectImage,
  type RandomImageLayout,
} from '@/app/lib/imageLayoutCore';

export type { ProjectImage, RandomImageLayout } from '@/app/lib/imageLayoutCore';

function isWithinViewport(rect: ImageRect, viewportWidth: number, viewportHeight: number) {
  return (
    rect.left >= PAGE_MARGIN_PX &&
    rect.top >= PAGE_MARGIN_PX &&
    rect.left + rect.boxWidth <= viewportWidth - PAGE_MARGIN_PX &&
    rect.top + rect.boxHeight <= viewportHeight - PAGE_MARGIN_PX
  );
}

function isValidOverlap(overlap: Overlap | null) {
  if (!overlap) {
    return false;
  }

  return (
    overlap.width > 0 &&
    overlap.height > 0 &&
    overlap.width <= MAX_OVERLAP_PX &&
    overlap.height <= MAX_OVERLAP_PX
  );
}

function isValidPlacement(newRect: ImageRect, previousRects: ImageRect[]) {
  if (previousRects.length === 0) {
    return true;
  }

  const overlapsAtLeastOnePrevious = previousRects.some((previous) =>
    isValidOverlap(getOverlap(newRect, previous)),
  );

  if (!overlapsAtLeastOnePrevious) {
    return false;
  }

  for (const previous of previousRects) {
    const overlap = getOverlap(newRect, previous);

    if (overlap && (overlap.width > MAX_OVERLAP_PX || overlap.height > MAX_OVERLAP_PX)) {
      return false;
    }
  }

  if (previousRects.length >= 2) {
    return !hasTripleOverlap(previousRects[0], previousRects[1], newRect);
  }

  return true;
}

function scanOverlappingPositions(
  bounds: ImageBounds,
  reference: ImageRect,
  viewportWidth: number,
  viewportHeight: number,
  step = PLACEMENT_SCAN_STEP_PX,
) {
  const placements: Placement[] = [];
  const minLeft = Math.ceil(reference.left - bounds.boxWidth + 1);
  const maxLeft = Math.floor(reference.left + reference.boxWidth - 1);
  const minTop = Math.ceil(reference.top - bounds.boxHeight + 1);
  const maxTop = Math.floor(reference.top + reference.boxHeight - 1);

  for (let left = minLeft; left <= maxLeft; left += step) {
    for (let top = minTop; top <= maxTop; top += step) {
      const rect = rectFromPlacement(bounds, { left, top });

      if (!isWithinViewport(rect, viewportWidth, viewportHeight)) {
        continue;
      }

      if (!isValidOverlap(getOverlap(rect, reference))) {
        continue;
      }

      placements.push({ left, top });
    }
  }

  return placements;
}

function findConstrainedPlacement(
  bounds: ImageBounds,
  previousRects: ImageRect[],
  viewportWidth: number,
  viewportHeight: number,
  step = PLACEMENT_SCAN_STEP_PX,
): Placement | null {
  const candidates = Array.from(
    new Map(
      previousRects
        .flatMap((reference) =>
          scanOverlappingPositions(bounds, reference, viewportWidth, viewportHeight, step),
        )
        .map((candidate) => [`${candidate.left}:${candidate.top}`, candidate]),
    ).values(),
  );

  const validCandidates = candidates.filter((candidate) =>
    isValidPlacement(rectFromPlacement(bounds, candidate), previousRects),
  );

  return validCandidates.length > 0 ? pickRandom(validCandidates) : null;
}

function createAnchoredOverlapPlacement(bounds: ImageBounds, reference: ImageRect): Placement {
  const overlapWidth = Math.min(MAX_OVERLAP_PX, bounds.boxWidth, reference.boxWidth);
  const overlapHeight = Math.min(MAX_OVERLAP_PX, bounds.boxHeight, reference.boxHeight);

  return {
    left: reference.left + reference.boxWidth - overlapWidth,
    top: reference.top + reference.boxHeight - overlapHeight,
  };
}

function findPlacement(
  bounds: ImageBounds,
  previousRects: ImageRect[],
  viewportWidth: number,
  viewportHeight: number,
): Placement | null {
  if (previousRects.length === 0) {
    return getRandomPosition(bounds, viewportWidth, viewportHeight);
  }

  return findConstrainedPlacement(bounds, previousRects, viewportWidth, viewportHeight);
}

export function createRandomImageLayout(
  image: ProjectImage,
  previousLayouts: RandomImageLayout[] = [],
): RandomImageLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isLandscape = isLandscapeImage(image);
  const previousRects = getRecentRects(previousLayouts);
  const sizes = shuffleSizes(viewportWidth);
  const sizesToTry = previousRects.length > 0 ? [...sizes].sort((a, b) => a - b) : sizes;
  const smallestSizeVw = getSmallestImageSizeVw(viewportWidth);

  for (const sizeVw of sizesToTry) {
    const bounds = scaleBoundsToFitViewport(
      getImageBounds(image, sizeVw, isLandscape, viewportWidth),
      viewportWidth,
      viewportHeight,
    );
    const placement = findPlacement(bounds, previousRects, viewportWidth, viewportHeight);

    if (placement) {
      return buildLayout(image, bounds, placement, isLandscape, sizeVw);
    }
  }

  if (previousRects.length > 0) {
    const smallestBounds = scaleBoundsToFitViewport(
      getImageBounds(image, smallestSizeVw, isLandscape, viewportWidth),
      viewportWidth,
      viewportHeight,
    );

    for (const step of [12, 8, 4]) {
      const constrainedPlacement = findConstrainedPlacement(
        smallestBounds,
        previousRects,
        viewportWidth,
        viewportHeight,
        step,
      );

      if (constrainedPlacement) {
        return buildLayout(image, smallestBounds, constrainedPlacement, isLandscape, smallestSizeVw);
      }
    }

    for (const reference of previousRects) {
      const anchoredPlacement = clampToViewport(
        smallestBounds,
        createAnchoredOverlapPlacement(smallestBounds, reference),
        viewportWidth,
        viewportHeight,
      );

      if (isValidPlacement(rectFromPlacement(smallestBounds, anchoredPlacement), previousRects)) {
        return buildLayout(image, smallestBounds, anchoredPlacement, isLandscape, smallestSizeVw);
      }
    }
  }

  const fallbackBounds = scaleBoundsToFitViewport(
    getImageBounds(image, smallestSizeVw, isLandscape, viewportWidth),
    viewportWidth,
    viewportHeight,
  );

  return buildLayout(
    image,
    fallbackBounds,
    getRandomPosition(fallbackBounds, viewportWidth, viewportHeight),
    isLandscape,
    smallestSizeVw,
  );
}
