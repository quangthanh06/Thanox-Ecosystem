import React, { useState, useEffect } from 'react';
import { getResponsiveImageSources, markImageAsLoaded, isImagePreloaded } from '../../utils/imageOptimizer';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
  aspectRatio?: string; // e.g. '16/9', '1/1', '4/3'
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = 'Image',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  fallbackSrc = '/thanox-master-banner.webp',
  aspectRatio,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => (src ? isImagePreloaded(src) : false));

  // Reset states if src prop changes
  useEffect(() => {
    setHasError(false);
    if (src && isImagePreloaded(src)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  const sources = getResponsiveImageSources(hasError || !src ? fallbackSrc : src);
  const effectiveFallback = sources.fallbackSrc || fallbackSrc;

  const styleAspect = aspectRatio ? { aspectRatio } : undefined;

  return (
    <div
      style={styleAspect}
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#121124] via-[#1a153a] to-[#0d0d1a] flex items-center justify-center ${containerClassName}`}
    >
      {/* 0ms Cyber glow backdrop to eliminate blank black cards and guarantee 0 CLS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

      <picture className="w-full h-full flex items-center justify-center">
        {sources.avifSrcSet && (
          <source type="image/avif" srcSet={sources.avifSrcSet} sizes={sizes} />
        )}
        {sources.webpSrcSet && (
          <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} />
        )}
        <img
          src={effectiveFallback}
          alt={alt}
          onLoad={() => {
            if (src) markImageAsLoaded(src);
            setIsLoaded(true);
          }}
          onError={() => {
            if (!hasError) {
              setHasError(true);
            }
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchpriority: 'high' } : {})}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-90'}`}
          {...props}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;
