import React, { useState } from 'react';
import { Package, Smartphone, Zap, Shield, Key, Gamepad2, Layers } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackCategory?: string;
  fallbackText?: string;
}

// Curated high-res, reliable CDN gaming & tech banners matched by category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'MENU FF': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  'FILE ANDROID': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'FILE IOS': 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80',
  'PROXY IOS': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'PROXY RIÊNG': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'ACC CLONE': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
  'TÀI KHOẢN GAME': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
  'KEY VIP': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  DEFAULT: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
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
};

/**
 * Product Image with smart fallback to high-resolution category artwork
 */
export const ProductImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackCategory = 'DEFAULT',
  fallbackText,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedCategory = (fallbackCategory || '').toUpperCase().trim();

  const fallbackUrl =
    CATEGORY_FALLBACK_IMAGES[normalizedCategory] ||
    CATEGORY_FALLBACK_IMAGES['DEFAULT'];

  // Check if URL is clearly empty, broken or invalid
  const isInvalidUrl = !src || src.trim() === '' || src === 'null' || src === 'undefined';

  if (isInvalidUrl || hasError) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#121224] flex items-center justify-center ${className}`}>
        <img
          src={fallbackUrl}
          alt={alt || 'Product Image'}
          className="w-full h-full object-cover brightness-90 contrast-105"
          onError={(e) => {
            // Absolute fallback to pure styled CSS gradient
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
        {/* Subtle Cyber Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-transparent to-black/30 pointer-events-none" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Product Image'}
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

/**
 * Category Icon with auto-fallback to Emoji / Gradient Badge
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

  const potentialImgUrl = image || (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:image')) ? icon : null);

  if (potentialImgUrl && !imgError) {
    return (
      <img
        src={potentialImgUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${className} object-cover rounded-xl`}
        loading="lazy"
      />
    );
  }

  // If icon is a simple emoji
  if (icon && !icon.startsWith('http') && icon.length <= 4) {
    return <span className="text-xl leading-none">{icon}</span>;
  }

  // Fallback Emoji based on name
  return <span className="text-xl leading-none">{defaultEmoji}</span>;
};
