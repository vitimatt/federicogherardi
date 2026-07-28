/** Global image opacity design system — black vs white resting values and fade timing. */
export const IMAGE_OPACITY_ON_BLACK = 0.2;
export const IMAGE_OPACITY_ON_WHITE = 0.35;

/** Opening/loading screen images are exempt from IMAGE_OPACITY_ON_BLACK. */
export const OPENING_SCREEN_IMAGE_OPACITY = 1;

export const IMAGE_FADE_MS = 400;
export const IMAGE_FADE_FAST_MS = 150;

export const IMAGE_OPACITY_CSS_VARS = {
  black: '--image-opacity-on-black',
  white: '--image-opacity-on-white',
  fadeMs: '--image-fade-ms',
  fadeFastMs: '--image-fade-fast-ms',
  bgFadeMs: '--project-bg-fade-ms',
} as const;
