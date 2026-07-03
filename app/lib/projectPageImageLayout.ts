/**
 * Project page image layout
 * -------------------------
 *
 * IMAGE 1
 * - Carried over from homepage hover (same position), OR random viewport position on direct visit.
 *
 * IMAGES 2+
 * - Each relates only to the image directly above it.
 * - Images progress downward, forming a random-looking column.
 * - Every pair must overlap on BOTH axes.
 * - Each step uses either:
 *     • strong vertical overlap (100–300 px) + weak horizontal (10–50 px), OR
 *     • strong horizontal overlap (100–300 px) + weak vertical (10–50 px)
 *
 * SIZING
 * - Random size from 25, 30, or 35 vw (short side).
 * - Landscape images rotated 90°.
 * - Never 3 consecutive images at the same size.
 * - Width must fit viewport margins; height extends the scrollable page.
 */

import {
  buildLayout,
  getImageBounds,
  getOverlap,
  IMAGE_SIZES_VW,
  isLandscapeImage,
  PAGE_MARGIN_PX,
  PROJECT_PAGE_CAPTION_GAP_PX,
  PROJECT_PAGE_CAPTION_LINE_PX,
  layoutToRect,
  pickLayoutAvoidingThreeSameSizes,
  rectFromPlacement,
  scaleBoundsToFitWidth,
  shuffleSizes,
  withSizeVw,
  type ImageBounds,
  type ImageRect,
  type Overlap,
  type Placement,
  type ProjectImage,
  type RandomImageLayout,
} from '@/app/lib/imageLayoutCore';
import { createRandomImageLayout } from '@/app/lib/randomImageLayout';

export type { ProjectImage, RandomImageLayout } from '@/app/lib/imageLayoutCore';

export const PROJECT_PAGE_RULES = {
  sizesVw: [25, 30, 35],
  pageMarginPx: PAGE_MARGIN_PX,
  strongOverlapMinPx: 100,
  strongOverlapMaxPx: 300,
  weakOverlapMinPx: 10,
  weakOverlapMaxPx: 50,
} as const;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickOverlapAxes() {
  const strongVertical = Math.random() < 0.4;

  if (strongVertical) {
    return {
      mode: 'strongVertical' as const,
      overlapHeight: randomBetween(
        PROJECT_PAGE_RULES.strongOverlapMinPx,
        PROJECT_PAGE_RULES.strongOverlapMaxPx,
      ),
      overlapWidth: randomBetween(
        PROJECT_PAGE_RULES.weakOverlapMinPx,
        PROJECT_PAGE_RULES.weakOverlapMaxPx,
      ),
    };
  }

  return {
    mode: 'strongHorizontal' as const,
    overlapHeight: randomBetween(
      PROJECT_PAGE_RULES.weakOverlapMinPx,
      PROJECT_PAGE_RULES.weakOverlapMaxPx,
    ),
    overlapWidth: randomBetween(
      PROJECT_PAGE_RULES.strongOverlapMinPx,
      PROJECT_PAGE_RULES.strongOverlapMaxPx,
    ),
  };
}

function getExactOverlapAnchors(
  reference: ImageRect,
  newBoxWidth: number,
  overlapWidth: number,
) {
  return {
    leftShifted: reference.left - newBoxWidth + overlapWidth,
    rightShifted: reference.left + reference.boxWidth - overlapWidth,
  };
}

function findValidColumnLefts(
  bounds: ImageBounds,
  reference: ImageRect,
  overlapHeight: number,
  overlapWidth: number,
  viewportWidth: number,
) {
  const { leftShifted, rightShifted } = getExactOverlapAnchors(
    reference,
    bounds.boxWidth,
    overlapWidth,
  );
  const scanMin = Math.min(leftShifted, rightShifted);
  const scanMax = Math.max(leftShifted, rightShifted);
  const top = reference.top + reference.boxHeight - overlapHeight;
  const validLefts: number[] = [];

  for (let left = scanMin; left <= scanMax; left += 8) {
    const rect = rectFromPlacement(bounds, { left, top });

    if (isValidColumnPlacement(rect, reference, viewportWidth)) {
      validLefts.push(left);
    }
  }

  return validLefts;
}

function pickColumnLeft(validLefts: number[], mode: 'strongVertical' | 'strongHorizontal') {
  if (validLefts.length === 0) {
    return null;
  }

  if (mode === 'strongHorizontal') {
    const { leftShifted, rightShifted } = {
      leftShifted: validLefts[0]!,
      rightShifted: validLefts.at(-1)!,
    };
    const edgeChoices = validLefts.filter(
      (left) => Math.abs(left - leftShifted) <= 16 || Math.abs(left - rightShifted) <= 16,
    );

    if (edgeChoices.length > 0 && Math.random() < 0.75) {
      return edgeChoices[Math.floor(Math.random() * edgeChoices.length)]!;
    }
  }

  return validLefts[Math.floor(Math.random() * validLefts.length)]!;
}

function fitsHorizontally(rect: ImageRect, viewportWidth: number) {
  return (
    rect.left >= PAGE_MARGIN_PX && rect.left + rect.boxWidth <= viewportWidth - PAGE_MARGIN_PX
  );
}

function isStrongVerticalOverlap(overlap: Overlap) {
  return (
    overlap.height >= PROJECT_PAGE_RULES.strongOverlapMinPx &&
    overlap.height <= PROJECT_PAGE_RULES.strongOverlapMaxPx &&
    overlap.width >= PROJECT_PAGE_RULES.weakOverlapMinPx &&
    overlap.width <= PROJECT_PAGE_RULES.weakOverlapMaxPx
  );
}

function isStrongHorizontalOverlap(overlap: Overlap) {
  return (
    overlap.width >= PROJECT_PAGE_RULES.strongOverlapMinPx &&
    overlap.width <= PROJECT_PAGE_RULES.strongOverlapMaxPx &&
    overlap.height >= PROJECT_PAGE_RULES.weakOverlapMinPx &&
    overlap.height <= PROJECT_PAGE_RULES.weakOverlapMaxPx
  );
}

function isValidColumnOverlap(overlap: Overlap | null) {
  if (!overlap || overlap.width <= 0 || overlap.height <= 0) {
    return false;
  }

  return isStrongVerticalOverlap(overlap) || isStrongHorizontalOverlap(overlap);
}

function isValidColumnPlacement(newRect: ImageRect, reference: ImageRect, viewportWidth: number) {
  if (!fitsHorizontally(newRect, viewportWidth)) {
    return false;
  }

  if (newRect.top < PAGE_MARGIN_PX) {
    return false;
  }

  return isValidColumnOverlap(getOverlap(newRect, reference));
}

function createColumnPlacement(bounds: ImageBounds, reference: ImageRect, viewportWidth: number): Placement | null {
  const { mode, overlapHeight, overlapWidth } = pickOverlapAxes();
  const validLefts = findValidColumnLefts(
    bounds,
    reference,
    overlapHeight,
    overlapWidth,
    viewportWidth,
  );
  const left = pickColumnLeft(validLefts, mode);

  if (left === null) {
    return null;
  }

  const top = reference.top + reference.boxHeight - overlapHeight;

  return { left, top };
}

function createColumnPlacementWithMode(
  bounds: ImageBounds,
  reference: ImageRect,
  viewportWidth: number,
  mode: 'strongVertical' | 'strongHorizontal',
): Placement | null {
  const overlapHeight =
    mode === 'strongVertical'
      ? randomBetween(PROJECT_PAGE_RULES.strongOverlapMinPx, PROJECT_PAGE_RULES.strongOverlapMaxPx)
      : randomBetween(PROJECT_PAGE_RULES.weakOverlapMinPx, PROJECT_PAGE_RULES.weakOverlapMaxPx);
  const overlapWidth =
    mode === 'strongVertical'
      ? randomBetween(PROJECT_PAGE_RULES.weakOverlapMinPx, PROJECT_PAGE_RULES.weakOverlapMaxPx)
      : randomBetween(PROJECT_PAGE_RULES.strongOverlapMinPx, PROJECT_PAGE_RULES.strongOverlapMaxPx);
  const validLefts = findValidColumnLefts(
    bounds,
    reference,
    overlapHeight,
    overlapWidth,
    viewportWidth,
  );
  const left = pickColumnLeft(validLefts, mode);

  if (left === null) {
    return null;
  }

  return {
    left,
    top: reference.top + reference.boxHeight - overlapHeight,
  };
}

function findColumnPlacements(
  bounds: ImageBounds,
  reference: ImageRect,
  viewportWidth: number,
  attempts = 16,
) {
  const placements: Placement[] = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const placement = createColumnPlacement(bounds, reference, viewportWidth);

    if (placement) {
      placements.push(placement);
    }
  }

  for (const mode of ['strongHorizontal', 'strongVertical'] as const) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const placement = createColumnPlacementWithMode(bounds, reference, viewportWidth, mode);

      if (placement) {
        placements.push(placement);
      }
    }
  }

  return placements;
}

function pickLayoutWithOverlapBias(
  candidates: RandomImageLayout[],
  previousLayouts: RandomImageLayout[],
) {
  const reference = previousLayouts.at(-1);

  if (reference) {
    const referenceRect = layoutToRect(reference);
    const horizontalCandidates = candidates.filter((candidate) => {
      const overlap = getOverlap(layoutToRect(candidate), referenceRect);

      return overlap ? isStrongHorizontalOverlap(overlap) : false;
    });

    if (horizontalCandidates.length > 0 && Math.random() < 0.65) {
      return pickLayoutAvoidingThreeSameSizes(horizontalCandidates, previousLayouts);
    }
  }

  return pickLayoutAvoidingThreeSameSizes(candidates, previousLayouts);
}

export function createProjectPageImageLayout(
  image: ProjectImage,
  previousLayouts: RandomImageLayout[] = [],
): RandomImageLayout {
  const viewportWidth = window.innerWidth;
  const isLandscape = isLandscapeImage(image);
  const reference = previousLayouts.at(-1);

  if (!reference) {
    return createRandomImageLayout(image, []);
  }

  const referenceRect = layoutToRect(reference);

  const candidates: RandomImageLayout[] = [];

  for (const sizeVw of shuffleSizes()) {
    const bounds = scaleBoundsToFitWidth(
      getImageBounds(image, sizeVw, isLandscape, viewportWidth),
      viewportWidth,
    );
    const placements = findColumnPlacements(bounds, referenceRect, viewportWidth);

    for (const placement of placements) {
      const rect = rectFromPlacement(bounds, placement);

      if (isValidColumnPlacement(rect, referenceRect, viewportWidth)) {
        candidates.push(buildLayout(image, bounds, placement, isLandscape, sizeVw));
      }
    }
  }

  if (candidates.length > 0) {
    return pickLayoutWithOverlapBias(candidates, previousLayouts);
  }

  const fallbackBounds = scaleBoundsToFitWidth(
    getImageBounds(image, IMAGE_SIZES_VW[0], isLandscape, viewportWidth),
    viewportWidth,
  );

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const placement = createColumnPlacement(fallbackBounds, referenceRect, viewportWidth);

    if (placement) {
      return buildLayout(image, fallbackBounds, placement, isLandscape, IMAGE_SIZES_VW[0]);
    }
  }

  for (const mode of ['strongHorizontal', 'strongVertical'] as const) {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const placement = createColumnPlacementWithMode(
        fallbackBounds,
        referenceRect,
        viewportWidth,
        mode,
      );

      if (placement) {
        return buildLayout(image, fallbackBounds, placement, isLandscape, IMAGE_SIZES_VW[0]);
      }
    }
  }

  const overlapHeight = randomBetween(PROJECT_PAGE_RULES.weakOverlapMinPx, PROJECT_PAGE_RULES.weakOverlapMaxPx);
  const overlapWidth = randomBetween(PROJECT_PAGE_RULES.strongOverlapMinPx, PROJECT_PAGE_RULES.strongOverlapMaxPx);
  const validLefts = findValidColumnLefts(
    fallbackBounds,
    referenceRect,
    overlapHeight,
    overlapWidth,
    viewportWidth,
  );
  const left = pickColumnLeft(validLefts, 'strongHorizontal');
  const top = referenceRect.top + referenceRect.boxHeight - overlapHeight;

  if (left !== null) {
    return buildLayout(
      image,
      fallbackBounds,
      { left, top },
      isLandscape,
      IMAGE_SIZES_VW[0],
    );
  }

  const verticalOverlapHeight = randomBetween(
    PROJECT_PAGE_RULES.strongOverlapMinPx,
    PROJECT_PAGE_RULES.strongOverlapMaxPx,
  );
  const verticalOverlapWidth = randomBetween(
    PROJECT_PAGE_RULES.weakOverlapMinPx,
    PROJECT_PAGE_RULES.weakOverlapMaxPx,
  );
  const verticalTop = referenceRect.top + referenceRect.boxHeight - verticalOverlapHeight;
  const { leftShifted } = getExactOverlapAnchors(
    referenceRect,
    fallbackBounds.boxWidth,
    verticalOverlapWidth,
  );

  return buildLayout(
    image,
    fallbackBounds,
    { left: leftShifted, top: verticalTop },
    isLandscape,
    IMAGE_SIZES_VW[0],
  );
}

export function buildProjectPageImageLayouts(
  images: ProjectImage[],
  initialLayout?: RandomImageLayout | null,
) {
  const layouts: RandomImageLayout[] = [];
  const viewportWidth = window.innerWidth;

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];

    if (index === 0 && initialLayout?.image.url === image.url) {
      layouts.push(withSizeVw(initialLayout, viewportWidth));
      continue;
    }

    layouts.push(
      index === 0 ? createRandomImageLayout(image, []) : createProjectPageImageLayout(image, layouts),
    );
  }

  return layouts;
}

export function getProjectPageCanvasHeight(layouts: RandomImageLayout[]) {
  if (layouts.length === 0) {
    return window.innerHeight;
  }

  const maxBottom = Math.max(
    ...layouts.map(
      (layout) =>
        layout.top + layout.boxHeight + PROJECT_PAGE_CAPTION_GAP_PX + PROJECT_PAGE_CAPTION_LINE_PX,
    ),
  );

  return Math.max(window.innerHeight, maxBottom + PAGE_MARGIN_PX);
}
