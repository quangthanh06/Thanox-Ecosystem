/**
 * High-Performance Image Optimization Utilities
 * Generates responsive srcsets, handles AVIF/WebP next-gen formats, and deduplicates image network requests.
 */

// In-Memory cache for deduplicating image load events and preloaded URLs
const preloadedImageCache = new Set<string>();

/**
 * Returns responsive srcset strings for local optimized images.
 * Format: '/image.jpg' -> generates sources for AVIF and WebP across 320w, 640w, 1080w, 1920w
 */
export interface ResponsiveImageSources {
  avifSrcSet?: string;
  webpSrcSet?: string;
  fallbackSrc: string;
}

export function getResponsiveImageSources(src: string | undefined): ResponsiveImageSources {
  if (!src || src.trim() === '') {
    return { fallbackSrc: '/thanox-master-banner.jpg' };
  }

  const cleanSrc = src.trim();

  // If local static asset in /public (e.g., /thanox-master-banner.jpg)
  if (cleanSrc.startsWith('/') && !cleanSrc.startsWith('//')) {
    const lastDotIndex = cleanSrc.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const basePath = cleanSrc.substring(0, lastDotIndex);
      const ext = cleanSrc.substring(lastDotIndex).toLowerCase();

      // For known optimized assets
      const isKnownAsset = [
        '/thanox-master-banner',
        '/thanox-original-banner',
        '/gojo-eyes-banner',
        '/thanox-logo',
        '/thanox-robot-mascot',
      ].some((name) => basePath.endsWith(name));

      if (isKnownAsset) {
        const avifSrcSet = [
          `${basePath}-320w.avif 320w`,
          `${basePath}-640w.avif 640w`,
          `${basePath}-1080w.avif 1080w`,
          `${basePath}.avif 1920w`,
        ].join(', ');

        const webpSrcSet = [
          `${basePath}-320w.webp 320w`,
          `${basePath}-640w.webp 640w`,
          `${basePath}-1080w.webp 1080w`,
          `${basePath}.webp 1920w`,
        ].join(', ');

        return {
          avifSrcSet,
          webpSrcSet,
          fallbackSrc: `${basePath}.webp`,
        };
      }
    }
  }

  // If Supabase Storage URL
  // e.g., https://.../storage/v1/object/public/store_media/...
  if (cleanSrc.includes('supabase.co/storage/v1/object/public/')) {
    // Return original image with fast direct load
    return {
      fallbackSrc: cleanSrc,
    };
  }

  return { fallbackSrc: cleanSrc };
}

/**
 * Preload critical hero images with high fetch priority
 */
export function preloadPriorityImage(src: string): void {
  if (!src || typeof window === 'undefined' || preloadedImageCache.has(src)) return;

  try {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    preloadedImageCache.add(src);
  } catch {}
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
 * Preloads the top priority product images (up to 4) to eliminate layout shift and initial lag.
 */
export function preloadProductImageList(urls: (string | undefined)[]): void {
  if (!Array.isArray(urls) || typeof window === 'undefined') return;

  // Only preload up to 4 above-the-fold candidates to avoid bandwidth contention on mobile
  const candidates = urls.filter((u): u is string => Boolean(u && u.trim() !== '')).slice(0, 4);

  candidates.forEach((url) => {
    if (!preloadedImageCache.has(url)) {
      const img = new Image();
      img.src = url;
      img.onload = () => preloadedImageCache.add(url);
    }
  });
}
