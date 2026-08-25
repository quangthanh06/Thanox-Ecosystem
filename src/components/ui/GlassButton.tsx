import * as React from "react";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export type GlassButtonSize = "sm" | "default" | "lg" | "icon";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GlassButtonSize;
  contentClassName?: string;
  glow?: boolean;
}

const sizeClasses: Record<GlassButtonSize, { button: string; text: string }> = {
  sm: {
    button: "text-xs font-semibold min-h-[36px]",
    text: "px-4 py-2 gap-1.5",
  },
  default: {
    button: "text-sm font-bold min-h-[44px]",
    text: "px-6 py-3 gap-2",
  },
  lg: {
    button: "text-base font-extrabold min-h-[52px]",
    text: "px-8 py-4 gap-2.5",
  },
  icon: {
    button: "h-10 w-10 min-h-[40px] min-w-[40px]",
    text: "flex h-10 w-10 items-center justify-center p-0",
  },
};

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size = "default", contentClassName, glow = true, ...props }, ref) => {
    const currentSize = sizeClasses[size] || sizeClasses.default;

    return (
      <div
        className={cn(
          "glass-button-wrap cursor-pointer rounded-full",
          className
        )}
      >
        <button
          className={cn("glass-button rounded-full", currentSize.button)}
          ref={ref}
          {...props}
        >
          <span
            className={cn(
              "glass-button-text select-none tracking-tight",
              currentSize.text,
              contentClassName
            )}
          >
            {children}
          </span>
        </button>
        {glow && <div className="glass-button-shadow rounded-full"></div>}
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
export default GlassButton;
