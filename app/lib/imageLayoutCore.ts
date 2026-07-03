/**
 * Shared geometry and sizing for homepage hover and project page images.
 */

export const IMAGE_SIZES_VW = [25, 30, 35] as const;
export const PAGE_MARGIN_PX = 20;
export const PROJECT_PAGE_CAPTION_GAP_PX = 8;
export const PROJECT_PAGE_CAPTION_LINE_PX = 18;
export const MAX_OVERLAP_PX = 100;
export const PLACEMENT_SCAN_STEP_PX = 24;

export type ProjectImage = {
  url: string;
  width: number;
  height: number;
};

export type RandomImageLayout = {
  image: ProjectImage;
  isLandscape: boolean;
  top: number;
  left: number;
  boxWidth: number;
  boxHeight: number;
  renderWidth: number;
  renderHeight: number;
  sizeVw?: number;
};

export type ImageBounds = {
  boxWidth: number;
  boxHeight: number;
  renderWidth: number;
  renderHeight: number;
};

export type ImageRect = {
  top: number;
  left: number;
  boxWidth: number;
  boxHeight: number;
};

export type Overlap = {
  width: number;
  height: number;
};

export type Placement = {
  top: number;
  left: number;
};

export function shuffleSizes() {
  return [...IMAGE_SIZES_VW].sort(() => Math.random() - 0.5);
}

export function isLandscapeImage(image: ProjectImage) {
  return image.width > image.height;
}

export function getImageBounds(
  image: ProjectImage,
  sizeVw: number,
  isLandscape: boolean,
  viewportWidth: number,
): ImageBounds {
  const sizePx = viewportWidth * (sizeVw / 100);

  if (!isLandscape) {
    const renderWidth = sizePx;
    const renderHeight = renderWidth * (image.height / image.width);

    return {
      boxWidth: renderWidth,
      boxHeight: renderHeight,
      renderWidth,
      renderHeight,
    };
  }

  const renderHeight = sizePx;
  const renderWidth = renderHeight * (image.width / image.height);

  return {
    boxWidth: renderHeight,
    boxHeight: renderWidth,
    renderWidth,
    renderHeight,
  };
}

export function layoutToRect(layout: Pick<RandomImageLayout, 'top' | 'left' | 'boxWidth' | 'boxHeight'>): ImageRect {
  return {
    top: layout.top,
    left: layout.left,
    boxWidth: layout.boxWidth,
    boxHeight: layout.boxHeight,
  };
}

export function rectFromPlacement(bounds: ImageBounds, placement: Placement): ImageRect {
  return {
    top: placement.top,
    left: placement.left,
    boxWidth: bounds.boxWidth,
    boxHeight: bounds.boxHeight,
  };
}

export function getOverlap(a: ImageRect, b: ImageRect): Overlap | null {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.boxWidth, b.left + b.boxWidth);
  const bottom = Math.min(a.top + a.boxHeight, b.top + b.boxHeight);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    width: right - left,
    height: bottom - top,
  };
}

export function getMinimumGap(a: ImageRect, b: ImageRect) {
  const aRight = a.left + a.boxWidth;
  const aBottom = a.top + a.boxHeight;
  const bRight = b.left + b.boxWidth;
  const bBottom = b.top + b.boxHeight;
  const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(aRight, bRight));
  const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(aBottom, bBottom));

  if (dx === 0 && dy === 0) {
    return 0;
  }

  if (dx === 0) {
    return dy;
  }

  if (dy === 0) {
    return dx;
  }

  return Math.hypot(dx, dy);
}

export function hasTripleOverlap(a: ImageRect, b: ImageRect, c: ImageRect) {
  const left = Math.max(a.left, b.left, c.left);
  const top = Math.max(a.top, b.top, c.top);
  const right = Math.min(a.left + a.boxWidth, b.left + b.boxWidth, c.left + c.boxWidth);
  const bottom = Math.min(a.top + a.boxHeight, b.top + b.boxHeight, c.top + c.boxHeight);

  return right > left && bottom > top;
}

export function scaleBoundsToFitViewport(
  bounds: ImageBounds,
  viewportWidth: number,
  viewportHeight: number,
): ImageBounds {
  const fits =
    bounds.boxWidth <= viewportWidth - PAGE_MARGIN_PX * 2 &&
    bounds.boxHeight <= viewportHeight - PAGE_MARGIN_PX * 2;

  if (fits) {
    return bounds;
  }

  const scale = Math.min(
    (viewportWidth - PAGE_MARGIN_PX * 2) / bounds.boxWidth,
    (viewportHeight - PAGE_MARGIN_PX * 2) / bounds.boxHeight,
    1,
  );

  return {
    boxWidth: bounds.boxWidth * scale,
    boxHeight: bounds.boxHeight * scale,
    renderWidth: bounds.renderWidth * scale,
    renderHeight: bounds.renderHeight * scale,
  };
}

export function scaleBoundsToFitWidth(bounds: ImageBounds, viewportWidth: number): ImageBounds {
  if (bounds.boxWidth <= viewportWidth - PAGE_MARGIN_PX * 2) {
    return bounds;
  }

  const scale = (viewportWidth - PAGE_MARGIN_PX * 2) / bounds.boxWidth;

  return {
    boxWidth: bounds.boxWidth * scale,
    boxHeight: bounds.boxHeight * scale,
    renderWidth: bounds.renderWidth * scale,
    renderHeight: bounds.renderHeight * scale,
  };
}

export function getRandomPosition(bounds: ImageBounds, viewportWidth: number, viewportHeight: number): Placement {
  const maxLeft = viewportWidth - PAGE_MARGIN_PX - bounds.boxWidth;
  const maxTop = viewportHeight - PAGE_MARGIN_PX - bounds.boxHeight;

  return {
    left: PAGE_MARGIN_PX + Math.random() * Math.max(0, maxLeft - PAGE_MARGIN_PX),
    top: PAGE_MARGIN_PX + Math.random() * Math.max(0, maxTop - PAGE_MARGIN_PX),
  };
}

export function clampHorizontal(bounds: ImageBounds, position: Placement, viewportWidth: number): Placement {
  const maxLeft = viewportWidth - PAGE_MARGIN_PX - bounds.boxWidth;

  return {
    left: Math.min(Math.max(position.left, PAGE_MARGIN_PX), Math.max(PAGE_MARGIN_PX, maxLeft)),
    top: Math.max(position.top, PAGE_MARGIN_PX),
  };
}

export function clampToViewport(
  bounds: ImageBounds,
  position: Placement,
  viewportWidth: number,
  viewportHeight: number,
): Placement {
  const maxLeft = viewportWidth - PAGE_MARGIN_PX - bounds.boxWidth;
  const maxTop = viewportHeight - PAGE_MARGIN_PX - bounds.boxHeight;

  return {
    left: Math.min(Math.max(position.left, PAGE_MARGIN_PX), Math.max(PAGE_MARGIN_PX, maxLeft)),
    top: Math.min(Math.max(position.top, PAGE_MARGIN_PX), Math.max(PAGE_MARGIN_PX, maxTop)),
  };
}

export function buildLayout(
  image: ProjectImage,
  bounds: ImageBounds,
  position: Placement,
  isLandscape: boolean,
  sizeVw: number,
): RandomImageLayout {
  return {
    image,
    isLandscape,
    top: position.top,
    left: position.left,
    boxWidth: bounds.boxWidth,
    boxHeight: bounds.boxHeight,
    renderWidth: bounds.renderWidth,
    renderHeight: bounds.renderHeight,
    sizeVw,
  };
}

export function inferSizeVw(layout: RandomImageLayout, viewportWidth: number) {
  const reference = layout.isLandscape ? layout.renderHeight : layout.renderWidth;
  const vw = (reference / viewportWidth) * 100;

  return IMAGE_SIZES_VW.reduce((closest, size) =>
    Math.abs(size - vw) < Math.abs(closest - vw) ? size : closest,
  );
}

export function withSizeVw(layout: RandomImageLayout, viewportWidth: number): RandomImageLayout {
  return {
    ...layout,
    sizeVw: layout.sizeVw ?? inferSizeVw(layout, viewportWidth),
  };
}

export function syncLayoutFromDom(layout: RandomImageLayout, node: HTMLElement): RandomImageLayout {
  const rect = node.getBoundingClientRect();
  const top = Math.round(rect.top);
  const left = Math.round(rect.left);

  if (layout.isLandscape) {
    return {
      ...layout,
      top,
      left,
      boxWidth: Math.round(rect.width),
      boxHeight: Math.round(rect.height),
    };
  }

  const renderWidth = Math.round(rect.width);
  const renderHeight = Math.round(renderWidth * (layout.image.height / layout.image.width));

  return {
    ...layout,
    top,
    left,
    boxWidth: renderWidth,
    boxHeight: renderHeight,
    renderWidth,
    renderHeight,
  };
}

export function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function pickLayoutAvoidingThreeSameSizes(
  candidates: RandomImageLayout[],
  previousLayouts: RandomImageLayout[],
) {
  const recentSizes = previousLayouts.slice(-2).map((layout) => layout.sizeVw);
  const blockedSize =
    recentSizes.length === 2 && recentSizes[0] === recentSizes[1] ? recentSizes[0] : null;

  const pool = blockedSize
    ? candidates.filter((candidate) => candidate.sizeVw !== blockedSize)
    : candidates;

  return pickRandom(pool.length > 0 ? pool : candidates);
}

export function getRecentRects(layouts: RandomImageLayout[]) {
  return layouts.slice(-2).map(layoutToRect);
}
