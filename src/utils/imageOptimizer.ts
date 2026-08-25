/**
 * High-Speed Image Preloader & Cache Engine
 * Pre-fetches and keeps product images in browser memory & cache
 * to eliminate image loading lag on mobile & low-bandwidth networks.
 */

const PRELOADED_CACHE = new Set<string>();

export const preloadImage = (url?: string): Promise<void> => {
  if (!url || typeof window === 'undefined' || PRELOADED_CACHE.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    img.onload = () => {
      PRELOADED_CACHE.add(url);
      resolve();
    };
    img.onerror = () => resolve();
  });
};

export const preloadProductImageList = (urls: (string | undefined)[]) => {
  if (typeof window === 'undefined') return;
  urls.filter(Boolean).forEach((url) => {
    if (url) preloadImage(url);
  });
};
