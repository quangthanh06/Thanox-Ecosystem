/**
 * Dynamic Tab Favicon Synchronizer with Circular Transparency Clip
 * Removes ugly black square boxes and borders from browser tab icons
 */
export function setDynamicFavicon(imageUrl: string) {
  if (!imageUrl) return;

  const updateLinkTags = (href: string) => {
    const selectors = [
      "link[rel='icon']",
      "link[rel='shortcut icon']",
      "link[rel='apple-touch-icon']",
      "link[type='image/png']",
      "link[type='image/svg+xml']",
    ];
    const elements = document.querySelectorAll(selectors.join(', '));
    if (elements.length > 0) {
      elements.forEach((el) => {
        (el as HTMLLinkElement).href = href;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = href;
      document.head.appendChild(link);
    }
  };

  // If already a direct data URL or SVG, apply directly
  if (imageUrl.startsWith('data:image/svg') || imageUrl.endsWith('.svg')) {
    updateLinkTags(imageUrl);
    return;
  }

  // Create offscreen canvas to clip image into a clean transparent circle with NO black corners
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        updateLinkTags(imageUrl);
        return;
      }

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      const roundDataUrl = canvas.toDataURL('image/png');
      updateLinkTags(roundDataUrl);
    } catch {
      updateLinkTags(imageUrl);
    }
  };
  img.onerror = () => {
    updateLinkTags(imageUrl);
  };
  img.src = imageUrl;
}
