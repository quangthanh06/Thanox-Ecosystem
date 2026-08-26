import React, { useState, useEffect } from 'react';
import { OptimizedImage } from './OptimizedImage';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: string;
  fallbackText?: string;
  priority?: boolean;
}

// Local high-speed zero-latency gaming banners (AVIF / WebP ready)
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'MENU FF': '/thanox-master-banner.webp',
  'FILE ANDROID': '/thanox-original-banner.webp',
  'FILE IOS': '/gojo-eyes-banner.webp',
  'PROXY IOS': '/thanox-master-banner.webp',
  'PROXY RIÊNG': '/thanox-original-banner.webp',
  'ACC CLONE': '/thanox-master-banner.webp',
  'TÀI KHOẢN GAME': '/thanox-original-banner.webp',
  'KEY VIP': '/gojo-eyes-banner.webp',
  'LIÊN QUÂN IOS': '/thanox-master-banner.webp',
  DEFAULT: '/thanox-master-banner.webp',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  'FILE ANDROID': '🤖',
  'FILE IOS': '🍎',
  'MENU FF': '🎯',
  'PROXY IOS': '🌐',
  'PROXY RIÊNG': '⚡',
  'ACC CLONE': '🎮',
  'TÀI KHOẢN GAME': '💎',
  'KEY VIP': '🔑',
  'LIÊN QUÂN IOS': '⚔️',
};

/**
 * High-Performance Product Image with AVIF/WebP Next-Gen formats, responsive srcset, and 0ms Cyber Gradient
 */
export const ProductImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackCategory = 'DEFAULT',
  fallbackText,
  className = '',
  priority = false,
  ...props
}) => {
  const normalizedCategory = (fallbackCategory || '').toUpperCase().trim();
  const fallbackUrl =
    CATEGORY_FALLBACK_IMAGES[normalizedCategory] ||
    CATEGORY_FALLBACK_IMAGES['DEFAULT'] ||
    '/thanox-master-banner.webp';

  return (
    <OptimizedImage
      src={src}
      alt={alt || 'Product Image'}
      fallbackSrc={fallbackUrl}
      priority={priority}
      className={className}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      {...props}
    />
  );
};

/**
 * Category Icon with instant display and auto-fallback to Emoji
 */
export const CategoryIcon: React.FC<{
  icon?: string;
  image?: string;
  name: string;
  className?: string;
}> = ({ icon, image, name, className = 'w-full h-full' }) => {
  const [imgError, setImgError] = useState(false);

  const normalizedName = (name || '').toUpperCase().trim();
  const defaultEmoji = CATEGORY_EMOJIS[normalizedName] || '📱';

  const potentialImgUrl =
    image && image.trim() !== ''
      ? image
      : icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:image') || icon.startsWith('/'))
      ? icon
      : null;

  // Reset error when url changes
  useEffect(() => {
    setImgError(false);
  }, [potentialImgUrl]);

  if (potentialImgUrl && !imgError) {
    return (
      <img
        src={potentialImgUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${className} object-cover rounded-xl`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // If icon is a simple emoji or text
  const displayIcon =
    icon && !icon.startsWith('http') && !icon.startsWith('/') && icon.trim().length > 0 && icon.length <= 4
      ? icon
      : defaultEmoji;

  return (
    <div className="w-full h-full flex items-center justify-center select-none leading-none">
      <span className="text-xl sm:text-2xl leading-none flex items-center justify-center">{displayIcon}</span>
    </div>
  );
};

