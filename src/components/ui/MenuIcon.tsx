import React, { useState } from 'react';

export interface MenuIconProps extends React.SVGProps<SVGSVGElement> {
  isOpen?: boolean;
  size?: number | string;
  animateOnHover?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({
  isOpen = false,
  size = 24,
  animateOnHover = true,
  strokeWidth = 2.2,
  className = '',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const active = isOpen || (animateOnHover && isHovered);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`transition-transform duration-200 select-none overflow-visible ${className}`}
      {...props}
    >
      {/* Top Line -> rotates and morphs into top arm of X */}
      <line
        x1={4}
        y1={6}
        x2={20}
        y2={6}
        style={{
          transformOrigin: '12px 6px',
          transform: active ? 'translateY(6px) rotate(45deg)' : 'translateY(0) rotate(0deg)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Middle Line -> scales down and fades out */}
      <line
        x1={4}
        y1={12}
        x2={20}
        y2={12}
        style={{
          transformOrigin: 'center',
          opacity: active ? 0 : 1,
          transform: active ? 'scaleX(0.1)' : 'scaleX(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      />

      {/* Bottom Line -> rotates and morphs into bottom arm of X */}
      <line
        x1={4}
        y1={18}
        x2={20}
        y2={18}
        style={{
          transformOrigin: '12px 18px',
          transform: active ? 'translateY(-6px) rotate(-45deg)' : 'translateY(0) rotate(0deg)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </svg>
  );
};

export default MenuIcon;
