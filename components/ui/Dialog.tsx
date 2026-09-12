import * as React from "react"

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-[#050914]/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative z-50 w-full max-w-lg border border-[#82aadc33] bg-[#080E1C] p-6 shadow-[0_0_40px_rgba(24,216,255,0.05)] ${className || ''}`}>
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-[1px] bg-[#18D8FF]" />
        <div className="absolute top-0 left-0 w-[1px] h-4 bg-[#18D8FF]" />
        <div className="absolute bottom-0 right-0 w-4 h-[1px] bg-[#18D8FF]" />
        <div className="absolute bottom-0 right-0 w-[1px] h-4 bg-[#18D8FF]" />
        
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-display uppercase tracking-wider text-[#F2F7FF] mb-2">{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-mono text-[#A9B7CC] mb-6">{children}</p>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex justify-end gap-4">{children}</div>;
}
