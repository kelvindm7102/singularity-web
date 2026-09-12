import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`
          flex h-10 w-full bg-[#080E1C]/80 border border-[#82aadc33] px-3 py-2
          text-sm text-[#F2F7FF] font-mono tracking-wide placeholder:text-[#64748B]
          focus-visible:outline-none focus-visible:border-[#18D8FF]
          focus-visible:shadow-[0_0_12px_rgba(24,216,255,0.18)]
          disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
          ${className || ""}
        `}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
