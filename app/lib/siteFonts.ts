export const PRIMARY_FONT_FAMILY = 'ABC Diatype Variable Unlicensed Trial';
export const SECONDARY_FONT_FAMILY = 'OCR-A BT';
export const FONT_FADE_MS = 400;
export const FONT_READY_TIMEOUT_MS = 3000;

let siteFontsPromise: Promise<void> | null = null;

function withTimeout(promise: Promise<void>, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs);

    promise
      .then(() => {
        window.clearTimeout(timeout);
        resolve();
      })
      .catch(() => {
        window.clearTimeout(timeout);
        resolve();
      });
  });
}

function loadSiteFonts() {
  if (typeof document === 'undefined' || !document.fonts) {
    return Promise.resolve();
  }

  const loaded = Promise.all([
    document.fonts.load(`400 13px "${PRIMARY_FONT_FAMILY}"`),
    document.fonts.load(`400 13px "${SECONDARY_FONT_FAMILY}"`),
  ]).then(() => undefined);

  return withTimeout(loaded, FONT_READY_TIMEOUT_MS);
}

export function waitForSiteFonts() {
  if (!siteFontsPromise) {
    siteFontsPromise = loadSiteFonts();
  }

  return siteFontsPromise;
}
