/**
 * High-Performance Image Optimization Utilities
 * Generates responsive srcsets that EXACTLY match the files shipped in /public,
 * handles AVIF/WebP next-gen formats, and deduplicates image network requests.
 */

// In-Memory cache for deduplicating image load events and preloaded URLs
const preloadedImageCache = new Set<string>();

/**
 * Per-asset variant maps.
 * IMPORTANT: these MUST match the real files in /public — advertising a width
 * that doesn't exist causes a 404 and forces the browser to re-select/fail.
 */
const ASSET_VARIANTS: Record<string, number[]> = {
  '/thanox-master-banner': [320, 640, 1080], // base .avif/.webp = 1920w
  '/thanox-original-banner': [320, 640], // base = 1920w (no 1080w variant exists)
  '/gojo-eyes-banner': [320, 640], // base = 1920w (no 1080w variant exists)
  '/thanox-logo': [320], // base = 1920w
  '/thanox-robot-mascot': [320, 640], // base = 1920w
};

export interface ResponsiveImageSources {
  avifSrcSet?: string;
  webpSrcSet?: string;
  fallbackSrc: string;
}

function buildSrcSet(basePath: string, widths: number[], ext: string): string {
  const parts = widths.map((w) => `${basePath}-${w}w.${ext} ${w}w`);
  parts.push(`${basePath}.${ext} 1920w`);
  return parts.join(', ');
}

export function getResponsiveImageSources(src: string | undefined): ResponsiveImageSources {
  if (!src || src.trim() === '') {
    return { fallbackSrc: '/thanox-master-banner.webp' };
  }

  const cleanSrc = src.trim();

  // Local static asset in /public (e.g., /thanox-master-banner.jpg)
  if (cleanSrc.startsWith('/') && !cleanSrc.startsWith('//')) {
    const lastDotIndex = cleanSrc.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const basePath = cleanSrc.substring(0, lastDotIndex);
      const variants = ASSET_VARIANTS[basePath];

      if (variants) {
        return {
          avifSrcSet: buildSrcSet(basePath, variants, 'avif'),
          webpSrcSet: buildSrcSet(basePath, variants, 'webp'),
          fallbackSrc: `${basePath}.webp`,
        };
      }
    }
  }

  // Remote URLs (Supabase Storage etc.) — serve original directly
  return { fallbackSrc: cleanSrc };
}

/**
 * Preload a critical image with high fetch priority.
 * Supports responsive preloading via imagesrcset/imagesizes so the browser
 * downloads exactly the candidate it would have chosen for <img srcset>.
 */
export function preloadPriorityImage(
  src: string,
  options?: { imageSrcset?: string; imageSizes?: string }
): void {
  if (!src || typeof window === 'undefined') return;

  const cacheKey = `${src}|${options?.imageSrcset || ''}`;
  if (preloadedImageCache.has(cacheKey)) return;

  try {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', 'high');
    if (options?.imageSrcset) link.setAttribute('imagesrcset', options.imageSrcset);
    if (options?.imageSizes) link.setAttribute('imagesizes', options.imageSizes);
    document.head.appendChild(link);
    preloadedImageCache.add(cacheKey);
  } catch {
    /* noop */
  }
}

/**
 * Checks if a specific image has already been loaded in memory
 */
export function isImagePreloaded(src: string): boolean {
  return preloadedImageCache.has(src);
}

export function markImageAsLoaded(src: string): void {
  if (src) preloadedImageCache.add(src);
}

/**
 * Preloads above-the-fold product images AFTER the page is interactive so they
 * never compete with the hero/LCP request on slow connections.
 */
export function preloadProductImageList(urls: (string | undefined)[]): void {
  if (!Array.isArray(urls) || typeof window === 'undefined') return;

  const candidates = urls.filter((u): u is string => Boolean(u && u.trim() !== '')).slice(0, 4);

  const run = () => {
    candidates.forEach((url) => {
      if (preloadedImageCache.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.onload = () => preloadedImageCache.add(url);
    });
  };

  // Defer until the critical path is done: idle callback when available,
  // otherwise a short timeout after window load.
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => run(), { timeout: 3000 });
  } else if (document.readyState === 'complete') {
    setTimeout(run, 1200);
  } else {
    window.addEventListener('load', () => setTimeout(run, 1200), { once: true });
  }
}
