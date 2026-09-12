import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium tracking-widest uppercase transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 relative group overflow-hidden border";
    
    let sizeStyles = "h-10 px-4 py-2";
    if (size === "sm") {
      sizeStyles = "h-8 px-3 py-1 text-xs";
    } else if (size === "lg") {
      sizeStyles = "h-12 px-6 py-3 text-base";
    } else if (size === "icon") {
      sizeStyles = "h-8 w-8 p-0";
    }

    let variantStyles = "";
    if (variant === "primary") {
      variantStyles = "bg-[#1557C0]/20 text-[#18D8FF] border-[#18D8FF]/50 hover:bg-[#1557C0]/40 hover:border-[#18D8FF] hover:shadow-[0_0_12px_rgba(24,216,255,0.2)]";
    } else if (variant === "secondary") {
      variantStyles = "bg-[#080E1C]/80 text-[#F2F7FF] border-[#82aadc33] hover:bg-[#0B1324] hover:border-[#82aadc66]";
    } else if (variant === "destructive") {
      variantStyles = "bg-red-900/20 text-red-400 border-red-500/50 hover:bg-red-900/40 hover:border-red-400 hover:shadow-[0_0_12px_rgba(248,113,113,0.2)]";
    } else if (variant === "ghost") {
      variantStyles = "bg-transparent text-[#A9B7CC] border-transparent hover:text-[#F2F7FF] hover:bg-[#1557C0]/10";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className || ""}`}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{props.children}</span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
